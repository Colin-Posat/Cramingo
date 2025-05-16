import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
// @ts-ignore - missing type definitions for pdf-parse
import pdf from 'pdf-parse';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter to only accept PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure upload middleware with 10MB size limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export const parsePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    // Auth check 
    const user = req.headers.authorization ?
      JSON.parse(Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString())
      : null;
      
    if (!user || (!user.id && !user.uid)) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }
      
    // Make sure file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'No PDF file uploaded' });
      return;
    }
      
    const filePath = req.file.path;
    console.log('Processing PDF file:', filePath);
      
    try {
      // Read the PDF file
      const dataBuffer = fs.readFileSync(filePath);
      console.log('PDF file size:', dataBuffer.length, 'bytes');
          
      // Use pdf-parse instead of pdfjs-dist
      const options = {
        // No options needed for basic parsing
      };
      
      console.log('Starting to parse PDF');
      const data = await pdf(dataBuffer, options);
      console.log('PDF parsed successfully, text length:', data.text.length);
      
      // Get info from pdf-parse result
      const info = {
        numPages: data.numpages,
        info: data.info || {},
        metadata: data.metadata || {}
      };
      console.log('PDF info:', JSON.stringify(info, null, 2));
      
      // Clean up the text
      let fullText = data.text.replace(/\s{2,}/g, ' ').trim();
            
      // Send the extracted text back to the client
      res.json({
        text: fullText,
        pageCount: data.numpages,
        info: {
          title: data.info?.Title || '',
          author: data.info?.Author || ''
        }
      });
        
    } catch (pdfError) {
      console.error('Error parsing PDF:', pdfError);
      
      // Get the error message
      const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error';
      
      // Check if it's a size-related error
      const isSizeError = 
        errorMessage.toLowerCase().includes('size') || 
        errorMessage.toLowerCase().includes('large') ||
        errorMessage.toLowerCase().includes('limit') ||
        errorMessage.toLowerCase().includes('memory');
      
      if (isSizeError) {
        // For size errors, inform about the size limit
        res.status(400).json({
          message: 'The PDF file exceeds the maximum allowed size of 10MB. Please upload a smaller file.',
          error: errorMessage
        });
      } else {
        // For all other parsing errors, include a try again message
        res.status(400).json({
          message: 'Failed to parse PDF file. Please try uploading again.',
          error: errorMessage,
          action: 'retry'
        });
      }
    } finally {
      // Clean up: delete the uploaded file after processing
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Error handling PDF upload:', error);
    
    // Check if it's a multer error (which includes size limits)
    if (error instanceof Error && error.name === 'MulterError' && error.message.includes('limit')) {
      res.status(400).json({
        message: 'The PDF file exceeds the maximum allowed size of 10MB. Please upload a smaller file.',
        error: error.message
      });
    } else {
      // For general server errors, also suggest trying again
      res.status(500).json({
        message: 'Failed to process PDF file. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'retry'
      });
    }
  }
};