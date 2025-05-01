import express from "express";
import {
  signupInit,
  completeSignup,
  login,
  forgotPassword,
  getCurrentUser,
  checkUsernameAvailability,
  verifyToken,
  logout,
  googleSignup,
  exchangeGoogleToken,
  googleLogin,
  checkExistingAccount
} from "../controllers/authController";

const router = express.Router();

// Basic auth routes
router.post("/signup", signupInit);
router.post("/signup/complete", completeSignup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/user", getCurrentUser);
router.post("/check-username", checkUsernameAvailability);

// Token verification and logout
router.get("/verify-token", verifyToken);
router.post("/logout", logout);

// Google authentication routes
router.post('/google-signup', googleSignup);
router.post('/exchange-token', exchangeGoogleToken);
router.post('/google-login', googleLogin);
router.post('/check-existing-account', checkExistingAccount);


export default router;