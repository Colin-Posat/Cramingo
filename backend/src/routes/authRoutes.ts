import express from "express";
import { 
  signupInit, 
  completeSignup, 
  login, 
  forgotPassword, 
  getCurrentUser, 
  checkUsernameAvailability,
  verifyToken, // New route handler
  logout // New route handler
} from "../controllers/authController";

const router = express.Router();

router.post("/signup", signupInit);
router.post("/signup/complete", completeSignup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/user", getCurrentUser);
router.post("/check-username", checkUsernameAvailability);

// New routes for persistent authentication
router.get("/verify-token", verifyToken); // For checking token validity on app load
router.post("/logout", logout); // For server-side logout handling (optional with localStorage)

export default router;