import express from "express";
import { upload, uploadImage } from "../controllers/ImageUploadController";

const router = express.Router();

// Route for uploading images
router.post("/image", upload.single("image"), uploadImage);

export default router;