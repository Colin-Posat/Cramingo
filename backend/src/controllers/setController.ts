import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore();

// Create a new flashcard set
export const createSet = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract data from request body
    const { id, title, classCode, flashcards, isPublic, userId } = req.body;
    
    // Validate required fields
    if (!id || !title || !classCode || !Array.isArray(flashcards) || flashcards.length === 0 || !userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    
    // Check if a document with this ID already exists
    const existingDoc = await db.collection("flashcardSets").doc(id).get();
    
    if (existingDoc.exists) {
      res.status(409).json({ message: "A set with this ID already exists" });
      return;
    }
    
    // Create the document
    await db.collection("flashcardSets").doc(id).set({
      id,
      title,
      classCode,
      flashcards,
      isPublic: Boolean(isPublic),
      icon: isPublic 
        ? "/FliplyPNGs/public_flashcard_icon.png" 
        : "/FliplyPNGs/private_flashcard.png",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      numCards: flashcards.length
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
    const { title, classCode, flashcards, isPublic, userId } = req.body;
    
    // Validate required fields
    if (!title || !classCode || !Array.isArray(flashcards) || flashcards.length === 0 || !userId) {
      res.status(400).json({ message: "Missing required fields" });
      return;
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
    
    // Update the document
    await db.collection("flashcardSets").doc(setId).update({
      title,
      classCode,
      flashcards,
      isPublic: Boolean(isPublic),
      icon: isPublic 
        ? "/FliplyPNGs/public_flashcard_icon.png" 
        : "/FliplyPNGs/private_flashcard.png",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      numCards: flashcards.length
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
    // Get the user ID from the URL parameter
    const userId = req.params.userId;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    // Query for sets where the userId matches
    const setsSnapshot = await db.collection("flashcardSets")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    
    if (setsSnapshot.empty) {
      // No sets found, return empty array
      res.status(200).json([]);
      return;
    }
    
    // Convert the query snapshot to an array of data
    const sets = setsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${sets.length} sets for user ${userId}`);
    res.status(200).json(sets);
  } catch (error) {
    console.error("Error getting user sets:", error);
    res.status(500).json({ 
      message: "Failed to get user sets",
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
    const setData = docSnapshot.data();
    
    // Check if the user is the owner of the set
    if (setData && setData.userId !== userId) {
      res.status(403).json({ message: "You do not have permission to delete this set" });
      return;
    }
    
    // Delete the document
    await db.collection("flashcardSets").doc(setId).delete();
    
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