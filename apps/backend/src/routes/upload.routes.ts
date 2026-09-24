import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware, requireUser } from "../middleware/auth.middleware";
import { ValidationError } from "../utils/errors";

const router = Router();

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: prefix-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError("Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed."));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter
});

// Generic single file upload endpoint.
// Requires authentication (either customer, vendor, or admin).
// Returns the public URL of the uploaded image.
router.post("/", authMiddleware, upload.single("image"), (req: Request, res: Response, next: NextFunction) => {
  try {
    requireUser(req.user);
    if (!req.file) {
      throw new ValidationError("No image file provided");
    }

    // Since we'll configure Express to serve the 'public' directory at the root,
    // the URL to the image will be /uploads/filename
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(201).json({
      message: "Image uploaded successfully",
      imageUrl
    });
  } catch (error) {
    next(error);
  }
});

export default router;
