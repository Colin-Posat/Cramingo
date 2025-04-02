import express from "express";
import { 
  createSet, 
  updateSet, 
  getUserSets, 
  getSetById, 
  deleteSet 
} from "../controllers/setController";

const router = express.Router();

// Create a new flashcard set
router.post("/create", createSet);

// Update an existing flashcard set
router.put("/update/:id", updateSet);

// Get flashcard sets for a specific user
router.get("/user/:userId", getUserSets);

// Get a specific flashcard set by ID
router.get("/:id", getSetById);

// Delete a flashcard set
router.delete("/delete/:id", deleteSet);

export default router;