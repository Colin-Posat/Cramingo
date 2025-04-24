import express from "express";
import {
  likeSet,
  unlikeSet,
  checkLikeStatus,
  getSetLikes
} from "../controllers/likeController";

const router = express.Router();

// Like a flashcard set
router.post("/like", likeSet);

// Unlike a flashcard set
router.post("/unlike", unlikeSet);

// Check if a user has liked a set
router.get("/status", checkLikeStatus);

router.get("/count", getSetLikes);

export default router;