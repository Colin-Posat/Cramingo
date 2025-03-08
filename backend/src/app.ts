import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes"; // Import the auth routes
import { signupInit, completeSignup } from "./controllers/authController";

dotenv.config();

const app = express();

app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"], // Allow both frontend environments
      credentials: true,
    })
  );
app.use(express.json());
app.use("/api/auth", authRoutes);
app.post("/api/auth/signup-init", signupInit);
app.post("/api/auth/complete-signup", completeSignup);

export default app;
