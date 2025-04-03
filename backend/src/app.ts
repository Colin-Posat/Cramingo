import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import setsRoutes from "./routes/setRoutes";
import distractorRoutes from "./routes/distractorRoutes"; // Corrected import name
import userRoutes from './routes/userRoutes';
import genFlashcardsRoutes from './routes/genFlashcardsRoute';
import fileRoutes from './routes/fileRoutes';
import semanticRouter from './routes/semanticAnswerRoutes'




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

// Route registrations
app.use("/api/auth", authRoutes);
app.use("/api/sets", setsRoutes);
app.use("/api/quiz", distractorRoutes); // Using correct variable name
app.use('/api/user', userRoutes);
app.use('/api/ai', genFlashcardsRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/semantic-answer', semanticRouter);

// Direct route definitions for auth
app.post("/api/auth/signup-init", signupInit);
app.post("/api/auth/complete-signup", completeSignup);

export default app;