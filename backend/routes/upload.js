import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/auth.js';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'foodapp', resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else {
          console.log('[Cloudinary] Upload success:', result.secure_url);
          resolve(result.secure_url);
        }
      }
    );
    stream.end(file.buffer);
  });
}

// Also export for use in other routes (payment proofs, etc.)
export { uploadToCloudinary };

router.post('/public', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const url = await uploadToCloudinary(req.file);

    res.json({
      success: true,
      data: {
        url,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const url = await uploadToCloudinary(req.file);

    res.json({
      success: true,
      data: {
        url,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
