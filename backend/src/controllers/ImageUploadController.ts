import { Request, Response } from "express";
import admin from "firebase-admin";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";

// Initialize Firebase Storage
const storage = admin.storage();
const bucket = storage.bucket(); // Use default bucket configured in Firebase

// Configure multer for temporary storage of uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp-uploads');
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter for image files
const imageFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage: multerStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      
      // Get the file path
      const filePath = req.file.path;
      
      // Create a unique filename for storage
      const filename = `flashcard-images/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Try all possible bucket name formats
      const projectId = 'fliply-f4f1b';
      const possibleBucketNames = [
        projectId,  // Just the project ID
        `fliply-f4f1b.firebasestorage.app`
      ];
      
      console.log('Trying these bucket names:', possibleBucketNames);
      
      let uploadSuccessful = false;
      let imageUrl = '';
      
      // Try each bucket name until one works
      for (const bucketName of possibleBucketNames) {
        try {
          console.log(`Attempting upload with bucket: ${bucketName}`);
          const testBucket = admin.storage().bucket(bucketName);
          
          // Upload the file
          await testBucket.upload(filePath, {
            destination: filename,
            metadata: {
              contentType: req.file.mimetype,
              cacheControl: 'public, max-age=31536000',
            }
          });
          
          await testBucket.file(filename).makePublic();
          imageUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
          uploadSuccessful = true;
          console.log(`Success! Used bucket: ${bucketName}`);
          break;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`Failed with bucket ${bucketName}:`, errorMessage);
          continue;
        }
      }
      
      if (!uploadSuccessful) {
        throw new Error("Failed to upload to any bucket");
      }
      
      // Delete the temporary file
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });
      
      console.log('Successfully uploaded image:', imageUrl);
      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl
      });
    } catch (error) {
      console.error("Detailed upload error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
      res.status(500).json({
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };