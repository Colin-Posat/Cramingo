import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore();

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User profile not found" });
      return;
    }
    
    const userData = userDoc.data();

    // Return user profile data
    res.status(200).json({
      username: userData?.username || null,
      email: userData?.email || null,
      university: userData?.university || null,
      fieldOfStudy: userData?.fieldOfStudy || null,
      likes: userData?.likes || 0,
      createdAt: userData?.createdAt || null
    });

  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve user profile", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get auth token from request headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { username, university, fieldOfStudy } = req.body;
    
    // Basic validation
    if (!username || !university) {
      res.status(400).json({ message: "Username and university are required" });
      return;
    }

    // Update user profile in Firestore
    await db.collection("users").doc(uid).update({
      username,
      university,
      fieldOfStudy: fieldOfStudy || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({ 
      message: "Failed to update user profile", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
};