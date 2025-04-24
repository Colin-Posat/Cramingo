import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import setsRoutes from "./routes/setRoutes";
import distractorRoutes from "./routes/distractorRoutes";
import userRoutes from './routes/userRoutes';
import genFlashcardsRoutes from './routes/genFlashcardsRoute';
import fileRoutes from './routes/fileRoutes';
import semanticRouter from './routes/semanticAnswerRoutes';
import imageUploadRoutes from './routes/ImageUploadRoutes'; 
import feedbackRoutes from './routes/feedbackRoutes';
import likeRoutes from './routes/likeRoutes'

import { signupInit, completeSignup } from "./controllers/authController";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://25fd-169-233-243-85.ngrok-free.app",
      "https://fliply-backend.onrender.com",
      "https://fliply-frontend.onrender.com",
      "https://fliply.org",
      "https://fliplyai.com"
    ],
    credentials: true,
  })
);

app.use(express.json());

// Route registrations
app.use('/api/likes', likeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sets", setsRoutes);
app.use("/api/quiz", distractorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', genFlashcardsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/semantic-answer', semanticRouter);
app.use('/api/uploads', imageUploadRoutes); // Add this new route

// Direct route definitions for auth
app.post("/api/auth/signup-init", signupInit);
app.post("/api/auth/complete-signup", completeSignup);

export default app;