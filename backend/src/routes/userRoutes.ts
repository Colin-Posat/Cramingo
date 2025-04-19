import express from 'express';
import { 
  updateUserProfile, 
  getUserById, 
  getUserTotalLikes,
  syncUserTotalLikes
} from '../controllers/userController';

const router = express.Router();

// Get user by ID
router.get('/:userId', getUserById);

// Get user's total likes
router.get('/:userId/total-likes', getUserTotalLikes);

// Update user profile
router.post('/update-profile', updateUserProfile);

// Update user by ID (alternative endpoint)
router.put('/:userId', updateUserProfile);

// Sync a user's total likes (admin/maintenance route)
router.post('/:userId/sync-likes', syncUserTotalLikes);

export default router;