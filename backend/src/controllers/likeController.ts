import { Request, Response } from "express";
import admin from "firebase-admin";
import { updateUserTotalLikes } from "./userController";

const db = admin.firestore();

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

    // Update the creator's total likes
    if (setData.userId && currentLikes > 0) {
      await updateUserTotalLikes(setData.userId, -1);
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

export const getSetLikes = async (req: Request, res: Response): Promise<void> => {
    try {
      const setId = req.query.setId as string;
  
      if (!setId) {
        res.status(400).json({ message: "Set ID is required" });
        return;
      }
  
      // Get the set document
      const setDoc = await db.collection("flashcardSets").doc(setId).get();
  
      if (!setDoc.exists) {
        res.status(404).json({ message: "Set not found" });
        return;
      }
  
      const setData = setDoc.data() || {};
      const likesCount = setData.likes || 0;
  
      res.status(200).json({ 
        setId,
        likesCount
      });
    } catch (error) {
      console.error("Error getting set likes:", error);
      res.status(500).json({
        message: "Failed to get set likes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };