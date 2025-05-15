import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { AuthRequest } from "./auth";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = `${nanoid(10)}-${Date.now()}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter function to restrict file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
    // Documents
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Archives
    'application/zip', 'application/x-7z-compressed', 'application/x-rar-compressed',
    // Others
    'application/json', 'text/html', 'text/css', 'application/javascript'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max file size
    files: 10 // Max 10 files per upload
  },
  fileFilter
});

// Middleware to handle file uploads
export const fileUploadMiddleware = upload.array('files', 10); // Up to 10 files

// Middleware to handle file upload errors
export function handleFileUploadErrors(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large',
        error: 'One or more files exceeds the size limit of 2GB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ 
        message: 'Too many files',
        error: 'You can upload a maximum of 10 files at once'
      });
    }
    return res.status(400).json({ 
      message: 'File upload error',
      error: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({ 
      message: 'Internal server error',
      error: err.message
    });
  }
  
  // No error
  next();
}

// File path middleware to check if file exists
export function fileExistsMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const fileId = parseInt(req.params.id);
  
  if (isNaN(fileId)) {
    return res.status(400).json({ message: 'Invalid file ID' });
  }
  
  // Check if the file exists (will be implemented in the controller)
  next();
}
