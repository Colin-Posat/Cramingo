import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore(); // Firestore instance
const auth = admin.auth(); // Firebase Authentication instance

// ✅ Step 1: Store user credentials temporarily (no Firebase creation yet)
export const signupInit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // ✅ Store user credentials in Firestore temporarily
    const userRef = db.collection("pendingUsers").doc(email);
    await userRef.set({ email, password, username });

    res.status(200).json({ message: "User data stored, complete signup on details page" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: (error as Error).message });
  }
};

// ✅ Step 2: Create user in Firebase **after** details are submitted
export const completeSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, university, fieldOfStudy } = req.body;

    if (!email || !university) {
      res.status(400).json({ message: "University is required" });
      return;
    }

    // ✅ Fetch stored credentials
    const userRef = db.collection("pendingUsers").doc(email);
    const userData = (await userRef.get()).data();

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
    res.status(500).json({ message: "Signup completion failed", error: (error as Error).message });
  }
};
