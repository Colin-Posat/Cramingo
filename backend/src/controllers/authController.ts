import { Request, Response } from "express";
import admin from "firebase-admin";


export const testFirebase = async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const testRef = db.collection("test").doc("serverCheck");

    await testRef.set({ message: "Firebase is connected!", timestamp: new Date() });

    return res.status(200).json({ success: true, message: "Firebase is working!" });
  } catch (error: unknown) {
    const err = error as Error; // ✅ Ensures proper type casting
    console.error("🔥 Firebase connection failed:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Uses service account
  });
}

const auth = admin.auth();

export const signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // ✅ Use Firebase Admin to create a user
    const userRecord = await auth.createUser({
      email,
      password,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Signup failed",
      error: (error as Error).message,
    });
  }
};
