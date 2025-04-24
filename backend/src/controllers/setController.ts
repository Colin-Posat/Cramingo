import { Request, Response } from "express";
import admin from "firebase-admin";
import { updateUserTotalLikes } from "./userController";

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
      likes: 0 // Initialize likes count to 0
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
      likes: currentLikes // Preserve the likes count
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

    // Query for sets associated with the user that ARE derived/saved
    const setsSnapshot = await db.collection("flashcardSets")
      .where("userId", "==", userId)
      .where("isDerived", "==", true) // <-- Key change: Only get saved sets
      .orderBy("createdAt", "desc") // Order by when they were saved
      .get();

    if (setsSnapshot.empty) {
      res.status(200).json([]);
      return;
    }

    // Create an array to store the sets with additional information
    const sets = [];
    
    // Process each set
    for (const doc of setsSnapshot.docs) {
      const setData = doc.data();
      
      // If we already have savedByUsername from the save operation, use it
      let username = setData.savedByUsername || null;
      
      // If username isn't already in the document, fetch it from users collection
      if (!username && setData.userId) {
        try {
          const userDoc = await db.collection("users").doc(setData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data() || {};
            username = userData.username || userData.displayName || null;
          }
        } catch (userError) {
          console.error(`Error fetching user info for ${setData.userId}:`, userError);
        }
      }
      
      // Add the set with username to our results
      sets.push({
        id: doc.id,
        ...setData,
        savedByUsername: username // Add or update username
      });
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
    // Get the set ID from the URL parameter
    const setId = req.params.id;
    
    // Get the document
    const docSnapshot = await db.collection("flashcardSets").doc(setId).get();
    
    if (!docSnapshot.exists) {
      res.status(404).json({ message: "Flashcard set not found" });
      return;
    }
    
    // Return the set data
    res.status(200).json({
      id: docSnapshot.id,
      ...docSnapshot.data()
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
    if (currentLikes > 0) {
      await updateUserTotalLikes(userId, -currentLikes);
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
    
    if (!classCode) {
      res.status(400).json({ message: "Class code is required" });
      return;
    }
    
    // Query for public sets where the classCode matches
    const setsSnapshot = await db.collection("flashcardSets")
      .where("classCode", "==", classCode.toUpperCase())
      .where("isPublic", "==", true)
      .where("isDerived", "==", false)
      .orderBy("createdAt", "desc")
      .get();
    
    if (setsSnapshot.empty) {
      // No sets found, return empty array
      res.status(200).json([]);
      return;
    }
    
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
    
    console.log(`Found ${setsWithUserInfo.length} public sets for class code ${classCode}`);
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
    const { originalSetId, userId } = req.body;

    if (!originalSetId || !userId) {
      res.status(400).json({ message: "Original set ID and user ID are required" });
      return;
    }

    const originalSetDoc = await db.collection("flashcardSets").doc(originalSetId).get();

    if (!originalSetDoc.exists) {
      res.status(404).json({ message: "Original set not found" });
      return;
    }

    const originalSetData = originalSetDoc.data();

    if (!originalSetData) {
      res.status(500).json({ message: "Error retrieving set data" });
      return;
    }

    // Check if user already saved this specific set
    const existingSavedQuery = await db.collection("flashcardSets")
        .where("userId", "==", userId)
        .where("originalSetId", "==", originalSetId)
        .limit(1)
        .get();

    if (!existingSavedQuery.empty) {
         res.status(409).json({ message: "You have already saved this set" });
         return;
    }

    // Fetch the current user's info (the one saving the set)
    const userDoc = await db.collection("users").doc(userId).get();
    let savedByUsername = null;
    
    if (userDoc.exists) {
      const userData = userDoc.data() || {};
      savedByUsername = userData.username || userData.displayName || null;
    }

    // Fetch the original creator's username
    let originalCreatorUsername = null;
    if (originalSetData.userId) {
      try {
        const originalCreatorDoc = await db.collection("users").doc(originalSetData.userId).get();
        if (originalCreatorDoc.exists) {
          const creatorData = originalCreatorDoc.data() || {};
          originalCreatorUsername = creatorData.username || creatorData.displayName || null;
        }
      } catch (error) {
        console.error(`Error fetching original creator info for ${originalSetData.userId}:`, error);
      }
    }

    const newSetId = db.collection("flashcardSets").doc().id;

    await db.collection("flashcardSets").doc(newSetId).set({
      ...originalSetData,
      id: newSetId, // Use the new ID
      userId: userId, // Assign to the saving user
      originalSetId: originalSetId, // Link to the original
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // New creation time for this copy
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Set initial update time
      isDerived: true, // Mark as saved/derived
      savedByUsername: savedByUsername, // Who saved it
      originalCreatorUsername: originalCreatorUsername, // Add the username of original creator
      originalCreatorId: originalSetData.userId, // Add the ID of original creator
      likes: 0 // Reset likes count for the saved copy
    });

    console.log(`User ${userId} (${savedByUsername || 'unknown username'}) successfully saved set ${originalSetId} created by ${originalCreatorUsername || 'unknown creator'} as new set ${newSetId}`);
    res.status(201).json({
      message: "Set saved successfully",
      id: newSetId
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

    // Get the set document to verify it's a saved set (isDerived === true)
    const setDoc = await db.collection("flashcardSets").doc(setId).get();

    if (!setDoc.exists) {
      res.status(404).json({ message: "Set not found" });
      return;
    }

    const setData = setDoc.data();

    if (!setData) {
      res.status(500).json({ message: "Error retrieving set data" });
      return;
    }

    // Check if this is indeed a saved set
    if (!setData.isDerived) {
      res.status(400).json({ message: "This operation is only valid for saved sets" });
      return;
    }

    // Check if the current user is the one who saved this set
    if (setData.userId !== userId) {
      res.status(403).json({ message: "You do not have permission to unsave this set" });
      return;
    }

    // Delete the saved set
    await db.collection("flashcardSets").doc(setId).delete();

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

// Like a flashcard set
export const likeSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { setId, userId } = req.body;

    if (!setId || !userId) {
      res.status(400).json({ message: "Set ID and user ID are required" });
      return;
    }

    // Get the set document
    const setDoc = await db.collection("flashcardSets").doc(setId).get();

    if (!setDoc.exists) {
      res.status(404).json({ message: "Set not found" });
      return;
    }

    const setData = setDoc.data() || {};
    
    // Get the creator's user ID to update their total likes
    const creatorId = setData.userId;

    // Check if user has already liked this set
    const likeQuery = await db.collection("setLikes")
      .where("setId", "==", setId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!likeQuery.empty) {
      res.status(409).json({ message: "You have already liked this set" });
      return;
    }

    // Start a Firestore batch to ensure all operations succeed or fail together
    const batch = db.batch();

    // Create a new like document
    const newLikeId = db.collection("setLikes").doc().id;
    const likeRef = db.collection("setLikes").doc(newLikeId);
    batch.set(likeRef, {
      id: newLikeId,
      setId,
      userId,
      creatorId, // Store the creator's ID for easy reference
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update the set document with likes count
    const currentLikes = setData.likes || 0;
    const setRef = db.collection("flashcardSets").doc(setId);
    batch.update(setRef, {
      likes: currentLikes + 1
    });

    // Commit the batch operation
    await batch.commit();

    // After successful commit, update the creator's total likes
    if (creatorId) {
      await updateUserTotalLikes(creatorId, 1);
    }

    console.log(`User ${userId} liked set ${setId} created by ${creatorId}`);
    res.status(200).json({ 
      message: "Set liked successfully",
      setId,
      likesCount: currentLikes + 1
    });
  } catch (error) {
    console.error("Error liking set:", error);
    res.status(500).json({
      message: "Failed to like set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Unlike a flashcard set
export const unlikeSet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { setId, userId } = req.body;

    if (!setId || !userId) {
      res.status(400).json({ message: "Set ID and user ID are required" });
      return;
    }

    // Get the set document
    const setDoc = await db.collection("flashcardSets").doc(setId).get();

    if (!setDoc.exists) {
      res.status(404).json({ message: "Set not found" });
      return;
    }

    // Find the user's like document
    const likeQuery = await db.collection("setLikes")
      .where("setId", "==", setId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (likeQuery.empty) {
      res.status(404).json({ message: "You have not liked this set" });
      return;
    }

    // Delete the like document
    const likeDoc = likeQuery.docs[0];
    await db.collection("setLikes").doc(likeDoc.id).delete();

    // Update the set document with likes count
    const setData = setDoc.data() || {};
    const currentLikes = setData.likes || 0;
    
    if (currentLikes > 0) {
      await db.collection("flashcardSets").doc(setId).update({
        likes: currentLikes - 1
      });
    }

    console.log(`User ${userId} unliked set ${setId}`);
    res.status(200).json({ 
      message: "Set unliked successfully",
      setId,
      likesCount: Math.max(0, currentLikes - 1)
    });
  } catch (error) {
    console.error("Error unliking set:", error);
    res.status(500).json({
      message: "Failed to unlike set",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Check if a user has liked a set
export const checkLikeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const setId = req.query.setId as string;
    const userId = req.query.userId as string;

    if (!setId || !userId) {
      res.status(400).json({ message: "Set ID and user ID are required" });
      return;
    }

    // Find the user's like document
    const likeQuery = await db.collection("setLikes")
      .where("setId", "==", setId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    const hasLiked = !likeQuery.empty;

    res.status(200).json({ 
      hasLiked
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    res.status(500).json({
      message: "Failed to check like status",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getTopPopularSets = async (req: Request, res: Response): Promise<void> => {
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