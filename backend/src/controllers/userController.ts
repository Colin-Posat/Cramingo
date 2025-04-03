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
      // If user document doesn't exist yet, create it
      await db.collection("users").doc(uid).set({
        username: username || '',
        university: university || '',
        fieldOfStudy: fieldOfStudy || '',
        email: email || '',
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing user document
      await db.collection("users").doc(uid).update({
        username: username || userDoc.data()?.username || '',
        university: university || userDoc.data()?.university || '',
        fieldOfStudy: fieldOfStudy || userDoc.data()?.fieldOfStudy || '',
        email: email || userDoc.data()?.email || '',
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