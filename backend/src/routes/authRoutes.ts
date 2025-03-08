import express from "express";
import { signupInit } from "../controllers/authController";

const router = express.Router();

router.post("/signup", signupInit);

export default router;
