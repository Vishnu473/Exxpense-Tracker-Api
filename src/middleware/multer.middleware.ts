import multer, { FileFilterCallback } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import cloudinary from "../utils/cloudinary.utils";
import { Request, Response, NextFunction } from 'express';

const allowedImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const folderName:string = "images";
const MAX_FILES = 10;

interface FileCategoryRequest extends Request {
  fileCategory?: 'image';
}

// Cloudinary storage setup for images only
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: () => ({
    folder: 'images',
    allowed_formats: allowedImageFormats,
  }),
});


// File filter for images
const fileFilter = (
  req: FileCategoryRequest,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (req.fileCategory === 'image' && allowedImageFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format'));
  }
};

// Multer middleware for image uploads
const uploadImage = multer({
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// Main upload handler (image only)
const uploadFiles = (fileType: 'single' | 'multiple') => {
  return (req: FileCategoryRequest, res: Response, next: NextFunction) => {
    if (req.params.type === 'image') {
      req.fileCategory = 'image';
      fileType === 'single'
        ? uploadImage.single('file')(req, res, next)
        : uploadImage.array('files', MAX_FILES)(req, res, next);
    } else {
      res
        .status(400)
        .json({ error: "Invalid file type. Use 'image'" });
        next();
    }
  };
};


export { uploadFiles };
