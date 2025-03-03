import express from "express";
import { signup } from "../controllers/authController";
import { testFirebase } from "../controllers/authController";

const router = express.Router();

router.get("/test-firebase", testFirebase as any);

router.post("/signup", signup as any);

export default router;
