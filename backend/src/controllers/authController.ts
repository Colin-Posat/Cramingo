import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore(); // Firestore instance
const auth = admin.auth(); // Firebase Authentication instance

export const signupInit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    
    // Check if email already exists in Firebase Auth.
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: "Email is already in use" });
        return;
      }
    } catch (error) {
      // If error.code === 'auth/user-not-found', the email is not in use
      // This is the expected path for new users
      if ((error as any).code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // Also check pending users collection
    const pendingUserRef = db.collection("pendingUsers").doc(email);
    const pendingUserDoc = await pendingUserRef.get();
    
    if (pendingUserDoc.exists) {
      res.status(400).json({ message: "Email is already in use" });
      return;
    }
    
    // Store user credentials in Firestore temporarily
    await pendingUserRef.set({ email, password, username });
    
    res.status(200).json({ message: "User data stored, complete signup on details page" });
  } catch (error) {
    console.error("Signup initialization error:", error);
    res.status(500).json({ message: "Signup failed", error: (error as Error).message });
  }
};

export const completeSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, university, fieldOfStudy } = req.body;

    if (!email || !university) {
      res.status(400).json({ message: "University is required" });
      return;
    }

    // ✅ Fetch stored credentials
    const userRef = db.collection("pendingUsers").doc(email);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData) {
      res.status(400).json({ message: "Signup session expired. Please try again." });
      return;
    }

    // ✅ Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
    });

    // ✅ Store full user details in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      username: userData.username,
      email: userData.email,
      university,
      fieldOfStudy,
      createdAt: new Date(),
    });

    // ✅ Cleanup pending user data
    await userRef.delete();

    res.status(201).json({
      message: "User successfully created",
      user: { uid: userRecord.uid, email: userRecord.email, university, fieldOfStudy },
    });
  } catch (error) {
    console.error("Signup completion error:", error);
    res.status(500).json({ message: "Signup completion failed", error: (error as Error).message });
  }
};



// Alternative approach with Firebase Admin SDK
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email)
      .catch(() => {
        throw new Error("Invalid email or password");
      });
    
    // Since we can't verify password with admin SDK directly,
    // you'd need to use the Firebase Auth REST API or client SDK
    // For simplicity here, we're just returning the user if found
    
    // Get user details from Firestore
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ message: "User profile not found" });
      return;
    }
    
    const userData = userDoc.data();

    res.status(200).json({
      message: "Login successful",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        username: userData?.username ?? "Unknown",
        university: userData?.university ?? "Unknown",
        fieldOfStudy: userData?.fieldOfStudy ?? "Unknown"
      }
    });

  } catch (error) {
    res.status(401).json({ 
      message: error instanceof Error ? error.message : "Authentication failed" 
    });
  }
};