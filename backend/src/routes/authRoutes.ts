import express from "express";
import { signupInit, completeSignup, login, forgotPassword, getCurrentUser } from "../controllers/authController";

const router = express.Router();

router.post("/signup", signupInit);
router.post("/signup/complete", completeSignup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/user", getCurrentUser);

export default router;