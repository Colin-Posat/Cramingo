import express from "express";
import { signupInit, login } from "../controllers/authController";

const router = express.Router();

router.post("/signup", signupInit);
router.post("/login", login);

export default router;