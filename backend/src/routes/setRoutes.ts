import express from "express";
import { 
  createSet, 
  updateSet, 
  getUserSets,
  getSavedSets,  
  getSetsByClassCode,
  getSetById, 
  deleteSet,
  saveSet
} from "../controllers/setController";

const router = express.Router();

// Create a new flashcard set
router.post("/create", createSet);

// Update an existing flashcard set
router.put("/update/:id", updateSet);

// Get flashcard sets for a specific user
router.get("/user/:userId", getUserSets);

router.get("/saved/:userId", getSavedSets);

router.get('/search', getSetsByClassCode);

// Get a specific flashcard set by ID
router.get("/:id", getSetById);

// Delete a flashcard set
router.delete("/delete/:id", deleteSet);

// Save an existing flashcard set to user's collection
router.post("/save", saveSet);

export default router;