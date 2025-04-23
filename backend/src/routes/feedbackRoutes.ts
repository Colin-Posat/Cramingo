import express from 'express';
import { submitFeedback } from '../controllers/feedbackController';

const router = express.Router();

/**
 * POST /api/feedback
 * Submits user feedback
 */
router.post('/', submitFeedback);

export default router;