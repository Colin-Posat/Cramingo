import { Request, Response } from "express";
import admin from "firebase-admin";

const db = admin.firestore();

export const logSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { school, classCode } = req.body;

    if (!school || !classCode) {
      res.status(400).json({ message: "Both school and classCode are required" });
      return;
    }

    // Build the entry
    const entry = {
      school,
      classCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add to userSearches collection
    const docRef = await db.collection("userLandingInputs").add(entry);

    console.log(`Logged search ${docRef.id}:`, entry);
    res.status(201).json({ message: "Search logged", id: docRef.id });
  } catch (error) {
    console.error("Error logging search:", error);
    res.status(500).json({
      message: "Failed to log search",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
