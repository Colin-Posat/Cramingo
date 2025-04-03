import express, { Request, Response, NextFunction } from 'express';
import { generateFlashcards } from '../controllers/genFlashcardsController';

const router = express.Router();

// Route for AI-powered flashcard generation
router.post('/generate-flashcards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await generateFlashcards(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;