import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore();

// Update a user profile
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract data from request body
    const { username, university, fieldOfStudy, email, uid } = req.body;
    
    // Validate required fields
    if (!uid) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    // Check if the user document exists
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      // If user document doesn't exist yet, create it with totalLikes initialized to 0
      await db.collection("users").doc(uid).set({
        username: username || '',
        university: university || '',
        fieldOfStudy: fieldOfStudy || '',
        email: email || '',
        uid,
        totalLikes: 0, // Initialize total likes count
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing user document, preserving totalLikes if it exists
      const userData = userDoc.data() || {};
      await db.collection("users").doc(uid).update({
        username: username || userData.username || '',
        university: university || userData.university || '',
        fieldOfStudy: fieldOfStudy || userData.fieldOfStudy || '',
        email: email || userData.email || '',
        // Don't update totalLikes here - it's managed by like/unlike functions
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log('Successfully updated user profile for UID:', uid);
    res.status(200).json({
      message: "User profile updated successfully",
      uid
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Failed to update user profile",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get a user profile by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the user ID from the URL parameter
    const userId = req.params.userId;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    // Get the user document
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    // Return the user data
    res.status(200).json({
      ...userDoc.data()
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      message: "Failed to get user profile",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get total likes count for a user
export const getUserTotalLikes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    const userData = userDoc.data() || {};
    const totalLikes = userData.totalLikes || 0;
    
    res.status(200).json({ totalLikes });
  } catch (error) {
    console.error("Error getting user's total likes:", error);
    res.status(500).json({
      message: "Failed to get user's total likes",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Update the total likes for a user
export const updateUserTotalLikes = async (userId: string, increment: number): Promise<void> => {
  try {
    // This helper function will be called by like/unlike functions
    if (!userId) {
      console.error("User ID is required to update total likes");
      return;
    }
    
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`User document with ID ${userId} not found for likes update`);
      return;
    }
    
    const userData = userDoc.data() || {};
    const currentTotalLikes = userData.totalLikes || 0;
    
    // Make sure we don't go below zero
    const newTotal = Math.max(0, currentTotalLikes + increment);
    
    await db.collection("users").doc(userId).update({
      totalLikes: newTotal
    });
    
    console.log(`Updated total likes for user ${userId} by ${increment}. New total: ${newTotal}`);
  } catch (error) {
    console.error("Error updating user's total likes:", error);
    throw error;
  }
};

// Sync a user's total likes (recalculate from scratch)
export const syncUserTotalLikes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
    
    // Get all sets created by this user
    const setsSnapshot = await db.collection("flashcardSets")
      .where("userId", "==", userId)
      .where("isDerived", "==", false) // Only count original sets, not saved copies
      .get();
    
    let totalLikes = 0;
    
    // Sum up all likes
    setsSnapshot.forEach(doc => {
      const setData = doc.data();
      totalLikes += setData.likes || 0;
    });
    
    // Update the user's total likes
    await db.collection("users").doc(userId).update({
      totalLikes: totalLikes
    });
    
    console.log(`Synced total likes for user ${userId}. Total likes: ${totalLikes}`);
    res.status(200).json({
      message: "Total likes synced successfully",
      userId,
      totalLikes
    });
  } catch (error) {
    console.error("Error syncing user's total likes:", error);
    res.status(500).json({
      message: "Failed to sync total likes",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};