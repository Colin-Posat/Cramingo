import { Request, Response } from "express";
import admin from "firebase-admin";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body; // ✅ Accept username

    if (!email || !password || !username) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const auth = admin.auth();
    const db = admin.firestore(); // ✅ Firestore instance

    // ✅ Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // ✅ Store additional user details in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      username,
      email,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        username, // ✅ Send username back
        email: userRecord.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: (error as Error).message,
    });
  }
};
