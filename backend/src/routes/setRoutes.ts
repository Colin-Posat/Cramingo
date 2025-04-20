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
  // Like functionality
  likeSet,
  unlikeSet,
  checkLikeStatus
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

// Search for public sets by class code
router.get('/search', getSetsByClassCode);

// Get a specific flashcard set by ID
router.get("/:id", getSetById);

// Delete a flashcard set
router.delete("/delete/:id", deleteSet);

// Save an existing flashcard set to user's collection
router.post("/save", saveSet);

// Unsave (remove) a saved flashcard set
router.post("/unsave", unsaveSet);

// Like a flashcard set
router.post("/like", likeSet);

// Unlike a flashcard set
router.post("/unlike", unlikeSet);

// Check if a user has liked a set
router.get("/like-status", checkLikeStatus);

export default router;