import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore();

// Create a new flashcard set
export const createSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, title, classCode, flashcards, isPublic, userId, description = '' } = req.body;

    if (!id || !title || !classCode || !Array.isArray(flashcards) || flashcards.length === 0 || !userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Validate flashcards structure - now includes image properties
    for (const card of flashcards) {
      // Check if at least a question or answer is provided (either text or image)
      const hasQuestionContent = card.question?.trim() || card.questionImage;
      const hasAnswerContent = card.answer?.trim() || card.answerImage;
      
      if (!hasQuestionContent || !hasAnswerContent) {
        res.status(400).json({ message: "Each flashcard must have both question and answer content" });
        return;
      }
    }

    const existingDoc = await db.collection("flashcardSets").doc(id).get();
    if (existingDoc.exists) {
      res.status(409).json({ message: "A set with this ID already exists" });
      return;
    }

    // Fetch the user's university from their user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const userData = userDoc.data() || {};
    const userSchool = userData.university || null;

    await db.collection("flashcardSets").doc(id).set({
      id,
      title,
      classCode,
      description: description.trim(),
      flashcards,
      isPublic: Boolean(isPublic),
      icon: isPublic
        ? "/FliplyPNGs/public_flashcard_icon.png"
        : "/FliplyPNGs/private_flashcard.png",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      numCards: flashcards.length,
      isDerived: false, // Explicitly mark as NOT derived/saved
      likes: 0, // Initialize likes count to 0
      school: userSchool // Add the university/school field from the user's document
    });

    console.log('Successfully created set with ID:', id);
    res.status(201).json({
      message: "Flashcard set created successfully",
      id
    });
  } catch (error) {
    console.error("Error creating flashcard set:", error);
    res.status(500).json({
      message: "Failed to create flashcard set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Update an existing flashcard set
export const updateSet = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the set ID from the URL parameter
    const setId = req.params.id;
    
    // Extract data from request body
    const { title, classCode, flashcards, isPublic, userId, description = '' } = req.body;
    
    // Validate required fields
    if (!title || !classCode || !Array.isArray(flashcards) || flashcards.length === 0 || !userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    
    // Validate flashcards structure - now includes image properties
    for (const card of flashcards) {
      // Check if at least a question or answer is provided (either text or image)
      const hasQuestionContent = card.question?.trim() || card.questionImage;
      const hasAnswerContent = card.answer?.trim() || card.answerImage;
      
      if (!hasQuestionContent || !hasAnswerContent) {
        res.status(400).json({ message: "Each flashcard must have both question and answer content" });
        return;
      }
    }
    
    // Check if the document exists
    const docSnapshot = await db.collection("flashcardSets").doc(setId).get();
    
    if (!docSnapshot.exists) {
      res.status(404).json({ message: "Flashcard set not found" });
      return;
    }
    
    // Get the set data
    const setData = docSnapshot.data();
    
    // Check if the user is the owner of the set
    if (setData && setData.userId !== userId) {
      res.status(403).json({ message: "You do not have permission to update this set" });
      return;
    }
    
    // Preserve the current likes count
    const currentLikes = setData?.likes || 0;
    
    // Preserve the school field from the existing set
    const school = setData?.school || null;
    
    // Update the document
    await db.collection("flashcardSets").doc(setId).update({
      title,
      classCode,
      description: description.trim(), 
      flashcards,
      isPublic: Boolean(isPublic),
      icon: isPublic 
        ? "/FliplyPNGs/public_flashcard_icon.png" 
        : "/FliplyPNGs/private_flashcard.png",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      numCards: flashcards.length,
      likes: currentLikes, // Preserve the likes count
      school // Preserve the school field
    });
    
    console.log('Successfully updated set with ID:', setId);
    res.status(200).json({ 
      message: "Flashcard set updated successfully",
      id: setId 
    });
  } catch (error) {
    console.error("Error updating flashcard set:", error);
    res.status(500).json({ 
      message: "Failed to update flashcard set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};


// Get flashcard sets for a specific user
export const getUserSets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Query for sets created by the user that are NOT derived/saved
    const setsSnapshot = await db.collection("flashcardSets")
      .where("userId", "==", userId)
      .where("isDerived", "==", false) // <-- Key change: Only get original sets
      .orderBy("createdAt", "desc")
      .get();

    if (setsSnapshot.empty) {
      res.status(200).json([]);
      return;
    }

    const sets = setsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${sets.length} originally created sets for user ${userId}`);
    res.status(200).json(sets);
  } catch (error) {
    console.error("Error getting user's created sets:", error);
    res.status(500).json({
      message: "Failed to get user's created sets",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get ONLY saved sets with username information
export const getSavedSets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Query for saved set references for this user
    const savedSetsSnapshot = await db.collection("userSavedSets")
      .where("userId", "==", userId)
      .orderBy("savedAt", "desc")
      .get();

    if (savedSetsSnapshot.empty) {
      res.status(200).json([]);
      return;
    }

    // Extract setIds from the saved sets
    const setIds = savedSetsSnapshot.docs.map(doc => {
      const data = doc.data();
      return data.setId;
    });

    // Get the actual flashcard sets
    const sets = [];
    for (const setId of setIds) {
      const setDoc = await db.collection("flashcardSets").doc(setId).get();
      if (setDoc.exists) {
        const setData = setDoc.data() || {};
        
        // Get username of creator
        let creatorUsername = null;
        if (setData.userId) {
          try {
            const userDoc = await db.collection("users").doc(setData.userId).get();
            if (userDoc.exists) {
              const userData = userDoc.data() || {};
              creatorUsername = userData.username || userData.displayName || null;
            }
          } catch (error) {
            console.error(`Error fetching user info for ${setData.userId}:`, error);
          }
        }
        
        // Add to our results with the username
        sets.push({
          id: setDoc.id,
          ...setData,
          createdBy: creatorUsername || `User ${setData.userId?.substring(0, 6) || 'unknown'}`,
          // Add savedAt timestamp from userSavedSets
          savedAt: savedSetsSnapshot.docs.find(doc => doc.data().setId === setId)?.data()?.savedAt || null
        });
      }
    }

    console.log(`Found ${sets.length} saved sets for user ${userId}`);
    res.status(200).json(sets);
  } catch (error) {
    console.error("Error getting user's saved sets:", error);
    res.status(500).json({
      message: "Failed to get user's saved sets",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get a specific flashcard set by ID
export const getSetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const setId = req.params.id;
    const docSnapshot = await db.collection("flashcardSets").doc(setId).get();
    
    if (!docSnapshot.exists) {
      res.status(404).json({ message: "Flashcard set not found" });
      return;
    }
    
    const setData = docSnapshot.data() || {};
    
    // If this is a saved/derived set, fetch the original set's likes
    if (setData.isDerived && setData.originalSetId) {
      try {
        const originalSetDoc = await db.collection("flashcardSets").doc(setData.originalSetId).get();
        if (originalSetDoc.exists) {
          const originalData = originalSetDoc.data() || {};
          // Either replace the likes completely, or add an originalLikes field
          setData.originalLikes = originalData.likes || 0;
          // Optionally: setData.likes = originalData.likes || 0;
        }
      } catch (error) {
        console.error("Error fetching original set likes:", error);
      }
    }
    
    res.status(200).json({
      id: docSnapshot.id,
      ...setData
    });
  } catch (error) {
    console.error("Error getting flashcard set:", error);
    res.status(500).json({ 
      message: "Failed to get flashcard set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
// Delete a flashcard set
export const deleteSet = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the set ID from the URL parameter
    const setId = req.params.id;
    
    // Get the user ID from the request (assuming it's available)
    const userId = req.body.userId || req.query.userId;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    // Check if the document exists
    const docSnapshot = await db.collection("flashcardSets").doc(setId).get();
    
    if (!docSnapshot.exists) {
      res.status(404).json({ message: "Flashcard set not found" });
      return;
    }
    
    // Get the set data
    const setData = docSnapshot.data() || {};
    const currentLikes = setData.likes || 0;
    
    // Check if the user is the owner of the set
    if (setData.userId !== userId) {
      res.status(403).json({ message: "You do not have permission to delete this set" });
      return;
    }
    
    // Get the flashcards to check for images to delete
    const flashcards = setData.flashcards || [];
    const imageUrls: string[] = [];
    
    // Define the flashcard type
    interface Flashcard {
      question: string;
      answer: string;
      questionImage?: string;
      answerImage?: string;
      hasQuestionImage?: boolean;
      hasAnswerImage?: boolean;
    }
    
    // Collect image URLs to delete
    flashcards.forEach((card: Flashcard) => {
      if (card.questionImage) imageUrls.push(card.questionImage);
      if (card.answerImage) imageUrls.push(card.answerImage);
    });
    
    // Delete the document
    await db.collection("flashcardSets").doc(setId).delete();
    
    // Delete associated images from storage if they exist
    if (imageUrls.length > 0) {
      try {
        const storage = admin.storage();
        const bucket = storage.bucket();
        
        // Delete each image asynchronously
        const deletePromises = imageUrls.map(url => {
          // Extract the path from the URL
          const urlObj = new URL(url);
          const path = urlObj.pathname.split('/').slice(2).join('/');
          return bucket.file(path).delete().catch(err => {
            console.error(`Failed to delete image at path ${path}:`, err);
            // Continue even if one image deletion fails
            return null;
          });
        });
        
        await Promise.all(deletePromises);
        console.log(`Deleted ${imageUrls.length} images associated with set ${setId}`);
      } catch (storageError) {
        console.error(`Error deleting images for set ${setId}:`, storageError);
        // Continue with set deletion even if image deletion fails
      }
    }
    
    // Also delete any associated likes
    const likesQuery = await db.collection("setLikes")
      .where("setId", "==", setId)
      .get();
    
    // Delete each like document in a batch
    if (!likesQuery.empty) {
      const batch = db.batch();
      likesQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Update the user's total likes count if this set had likes
    // This should be imported from userController
    if (currentLikes > 0) {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        const currentTotal = userData.totalLikes || 0;
        
        if (currentTotal > 0) {
          await userRef.update({
            totalLikes: Math.max(0, currentTotal - currentLikes)
          });
        }
      }
    }
    
    console.log('Successfully deleted set with ID:', setId);
    res.status(200).json({ 
      message: "Flashcard set deleted successfully",
      id: setId 
    });
  } catch (error) {
    console.error("Error deleting flashcard set:", error);
    res.status(500).json({ 
      message: "Failed to delete flashcard set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get flashcard sets by class code (for public search)
export const getSetsByClassCode = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the class code from the query parameter
    const classCode = req.query.classCode as string;
    const userId = req.query.userId as string;
    
    if (!classCode) {
      res.status(400).json({ message: "Class code is required" });
      return;
    }
    
    let school = null;
    
    // If userId is provided, try to get the user's school
    if (userId) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() || {};
        school = userData.university || null;
      }
    }
    
    // Initialize query to get all public sets matching the class code that are not derived
    let query = db.collection("flashcardSets")
      .where("classCode", "==", classCode.toUpperCase())
      .where("isPublic", "==", true)
      .where("isDerived", "==", false);
    
    // If we have the user's school, filter by that school
    if (school) {
      query = query.where("school", "==", school);
    }
    
    // Execute the query
    const setsSnapshot = await query.orderBy("createdAt", "desc").get();
    
    if (setsSnapshot.empty) {
      // No sets found with the school filter, return empty array
      res.status(200).json([]);
      return;
    }
    
    // Process results as before
    // Define a type for the Firestore document data
    interface FlashcardSetData {
      id: string;
      title: string;
      classCode: string;
      description?: string;
      flashcards: Array<{
        question: string; 
        answer: string;
        questionImage?: string;
        answerImage?: string;
        hasQuestionImage?: boolean;
        hasAnswerImage?: boolean;
      }>;
      isPublic: boolean;
      icon?: string;
      createdAt: any; // Firestore timestamp
      userId: string;
      numCards: number;
      likes?: number; // Add likes field to type
      school?: string; // Add school field to type
      [key: string]: any; // Allow for additional fields
    }
    
    // Get all sets data including userId with proper typing
    const setsData = setsSnapshot.docs.map(doc => {
      const data = doc.data() as Partial<FlashcardSetData>;
      return {
        id: doc.id,
        ...data
      } as FlashcardSetData;
    });
    
    // Rest of the code to process and return sets with user info
    // Create a map of userIds to avoid duplicates (ES5 compatible)
    const userIdMap: { [key: string]: boolean } = {};
    setsData.forEach(set => {
      // Only add to map if userId exists and is a string
      if (set.userId && typeof set.userId === 'string') {
        userIdMap[set.userId] = true;
      }
    });
    
    // Convert map to array
    const userIds = Object.keys(userIdMap);
    
    // Fetch user information for each unique userId
    const userInfoMap: { [userId: string]: string | null } = {};
    
    // Use a for loop instead of Promise.all for better compatibility
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data() || {};
          userInfoMap[userId] = userData.username || userData.displayName || null;
        } else {
          userInfoMap[userId] = null;
        }
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
        userInfoMap[userId] = null;
      }
    }
    
    // Add username to each set
    const setsWithUserInfo = setsData.map(set => {
      // Handle case where userId might be undefined
      const userId = set.userId || '';
      const shortUserId = userId.length > 6 ? userId.substring(0, 6) : userId;
      
      return {
        ...set,
        createdBy: userId && userInfoMap[userId] ? userInfoMap[userId] : `User ${shortUserId}`
      };
    });
    
    console.log(`Found ${setsWithUserInfo.length} public sets for class code ${classCode}${school ? ` and school ${school}` : ''}`);
    res.status(200).json(setsWithUserInfo);
  } catch (error) {
    console.error("Error getting sets by class code:", error);
    res.status(500).json({ 
      message: "Failed to get sets by class code",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Save an existing flashcard set to user's collection
export const saveSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { setId, userId } = req.body;

    if (!setId || !userId) {
      res.status(400).json({ message: "Set ID and user ID are required" });
      return;
    }

    // Check if the set exists
    const setDoc = await db.collection("flashcardSets").doc(setId).get();

    if (!setDoc.exists) {
      res.status(404).json({ message: "Set not found" });
      return;
    }

    // Check if this user has already saved this set
    const userSaveDoc = await db.collection("userSavedSets").where("setId", "==", setId).where("userId", "==", userId).limit(1).get();
    
    if (!userSaveDoc.empty) {
      res.status(409).json({ message: "You have already saved this set" });
      return;
    }

    // Create a record in userSavedSets collection instead of duplicating the set
    const saveId = db.collection("userSavedSets").doc().id;
    
    await db.collection("userSavedSets").doc(saveId).set({
      id: saveId,
      setId: setId,
      userId: userId,
      savedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${userId} successfully saved set ${setId}`);
    res.status(201).json({
      message: "Set saved successfully",
      id: setId
    });
  } catch (error) {
    console.error("Error saving set:", error);
    res.status(500).json({
      message: "Failed to save set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Unsave (remove) a saved flashcard set
export const unsaveSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { setId, userId } = req.body;

    if (!setId || !userId) {
      res.status(400).json({ message: "Set ID and user ID are required" });
      return;
    }

    // Find the saved set record
    const savedSetQuery = await db.collection("userSavedSets")
      .where("setId", "==", setId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (savedSetQuery.empty) {
      res.status(404).json({ message: "You have not saved this set" });
      return;
    }

    // Delete the saved set record
    const savedSetDoc = savedSetQuery.docs[0];
    await db.collection("userSavedSets").doc(savedSetDoc.id).delete();

    console.log(`User ${userId} successfully unsaved set ${setId}`);
    res.status(200).json({
      message: "Set unsaved successfully",
      id: setId
    });
  } catch (error) {
    console.error("Error unsaving set:", error);
    res.status(500).json({
      message: "Failed to unsave set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getTopPopularSets = async (req: Request, res: Response): Promise<void> => {
  console.log("getTopPopularSets controller called");
  try {
    // Query for public sets ordered by likes
    const setsSnapshot = await db.collection("flashcardSets")
      .where("isPublic", "==", true)
      .where("isDerived", "==", false) // Only original sets, not saved ones
      .orderBy("likes", "desc")
      .limit(5)
      .get();
    
    if (setsSnapshot.empty) {
      // No sets found, return empty array
      res.status(200).json([]);
      return;
    }
    
    // Define a type for the Firestore document data (same as in getSetsByClassCode)
    interface FlashcardSetData {
      id: string;
      title: string;
      classCode: string;
      description?: string;
      flashcards: Array<{
        question: string; 
        answer: string;
        questionImage?: string;
        answerImage?: string;
        hasQuestionImage?: boolean;
        hasAnswerImage?: boolean;
      }>;
      isPublic: boolean;
      icon?: string;
      createdAt: any; // Firestore timestamp
      userId: string;
      numCards: number;
      likes?: number;
      [key: string]: any; // Allow for additional fields
    }
    
    // Get all sets data including userId with proper typing
    const setsData = setsSnapshot.docs.map(doc => {
      const data = doc.data() as Partial<FlashcardSetData>;
      return {
        id: doc.id,
        ...data
      } as FlashcardSetData;
    });
    
    // Create a map of userIds to avoid duplicates
    const userIdMap: { [key: string]: boolean } = {};
    setsData.forEach(set => {
      // Only add to map if userId exists and is a string
      if (set.userId && typeof set.userId === 'string') {
        userIdMap[set.userId] = true;
      }
    });
    
    // Convert map to array
    const userIds = Object.keys(userIdMap);
    
    // Fetch user information for each unique userId
    const userInfoMap: { [userId: string]: string | null } = {};
    
    // Use a for loop instead of Promise.all for better compatibility
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data() || {};
          userInfoMap[userId] = userData.username || userData.displayName || null;
        } else {
          userInfoMap[userId] = null;
        }
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
        userInfoMap[userId] = null;
      }
    }
    
    // Add username to each set
    const setsWithUserInfo = setsData.map(set => {
      // Handle case where userId might be undefined
      const userId = set.userId || '';
      const shortUserId = userId.length > 6 ? userId.substring(0, 6) : userId;
      
      return {
        ...set,
        createdBy: userId && userInfoMap[userId] ? userInfoMap[userId] : `User ${shortUserId}`
      };
    });
    
    console.log(`Found ${setsWithUserInfo.length} top popular sets`);
    res.status(200).json(setsWithUserInfo);
  } catch (error) {
    console.error("Error getting top popular sets:", error);
    res.status(500).json({ 
      message: "Failed to get top popular sets",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Check if a user has saved a specific set
export const checkSavedStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, setId } = req.query;

    if (!userId || !setId) {
      res.status(400).json({ message: "User ID and Set ID are required" });
      return;
    }

    // Query for saved set record
    const savedSetQuery = await db.collection("userSavedSets")
      .where("setId", "==", setId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    const isSaved = !savedSetQuery.empty;

    res.status(200).json({
      isSaved,
      setId
    });
  } catch (error) {
    console.error("Error checking saved status:", error);
    res.status(500).json({
      message: "Failed to check saved status",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};