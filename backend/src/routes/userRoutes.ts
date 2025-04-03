import express from 'express';
import { updateUserProfile, getUserById } from '../controllers/userController';

const router = express.Router();

// Get user by ID
router.get('/:userId', getUserById);

// Update user profile - matches the endpoint you tried to use in frontend
router.post('/update-profile', updateUserProfile);

// Update user by ID
router.put('/:userId', updateUserProfile);

export default router;