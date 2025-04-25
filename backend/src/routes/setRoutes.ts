import express from "express";
import {
  createSet,
  updateSet,
  getUserSets,
  getSavedSets,
  getSetsByClassCode,
  getSetById,
  deleteSet,
  saveSet,
  unsaveSet,
  getTopPopularSets,
  checkSavedStatus // Added the new function
} from "../controllers/setController";

const router = express.Router();

// Create a new flashcard set
router.post("/create", createSet);

// Update an existing flashcard set
router.put("/update/:id", updateSet);

// Get flashcard sets for a specific user
router.get("/user/:userId", getUserSets);

// Get saved sets for a specific user
router.get("/saved/:userId", getSavedSets);

// Get top popular sets
router.get('/popular', getTopPopularSets);

// Search for public sets by class code
router.get('/search', getSetsByClassCode);

// Check if a user has saved a specific set
router.get('/saved-status', checkSavedStatus); // New route

// Get a specific flashcard set by ID
router.get("/:id", getSetById);

// Delete a flashcard set
router.delete("/delete/:id", deleteSet);

// Save an existing flashcard set to user's collection
router.post("/save", saveSet);

// Unsave (remove) a saved flashcard set
router.post("/unsave", unsaveSet);

export default router;