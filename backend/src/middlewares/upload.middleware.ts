import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { uploadBufferToS3 } from '../utils/s3Storage';

const uploadRoot = path.join(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg']);
// sharp/libvips' own format detector — the source of truth used below, since
// client-supplied mimetype/extension are just labels an attacker controls.
const ALLOWED_SHARP_FORMATS = new Set(['jpeg']);

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(ApiError.badRequest('نوع الملف غير مسموح — يُقبل فقط JPG أو JPEG') as unknown as Error);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(ApiError.badRequest('امتداد الملف غير مسموح') as unknown as Error);
  }
  cb(null, true);
}

// Buffer the upload in memory first — we never trust the raw bytes enough
// to write them straight to disk with the client's own filename/extension.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
    files: 5,
  },
});

/**
 * After multer buffers the file in memory, this verifies the bytes are
 * genuinely a decodable image (via libvips, not the client-supplied
 * mimetype/extension), strips EXIF/metadata (which can leak GPS/device info
 * or — rarely — carry crafted metadata payloads), and writes the result to
 * disk under a fresh random filename with an extension derived from the
 * *detected* format. This defeats the classic "shell.php.jpg" / polyglot
 * upload trick, since the extension on disk is never taken from user input.
 */
async function verifyAndPersistImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) return next();

    const image = sharp(file.buffer, { failOn: 'error' });
    const metadata = await image.metadata();

    if (!metadata.format || !ALLOWED_SHARP_FORMATS.has(metadata.format)) {
      throw ApiError.badRequest('الملف ليس صورة صالحة أو نوعه غير مدعوم');
    }
    // Guard against decompression-bomb style images (huge pixel dimensions
    // in a small file size).
    if ((metadata.width ?? 0) > 8000 || (metadata.height ?? 0) > 8000) {
      throw ApiError.badRequest('أبعاد الصورة كبيرة جداً');
    }

    const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;

    // Re-encode (not just copy) — this both strips all metadata/EXIF and
    // guarantees the bytes are exactly what libvips decoded, with nothing
    // extra appended after the image data (a common polyglot trick).
    const pipeline = image.rotate(); // auto-orient, then drop orientation EXIF
    const reencodedBuffer = await pipeline.jpeg({ quality: 88 }).toBuffer();

    if (env.storage.driver === 's3') {
      // Uploads written to disk on Railway/most PaaS do NOT survive a
      // redeploy — this path uploads to S3 (or any S3-compatible bucket)
      // instead and exposes the resulting public URL via req.fileUrl.
      req.fileUrl = await uploadBufferToS3(reencodedBuffer, `products/${filename}`, 'image/jpeg');
      req.file.filename = filename;
    } else {
      // Default, unchanged behaviour: write to local disk.
      const destPath = path.join(uploadRoot, filename);
      await fs.promises.writeFile(destPath, reencodedBuffer);
      req.file.filename = filename;
      req.file.path = destPath;
    }

    next();
  } catch (err) {
    logger.warn('Rejected image upload', err);
    next(err instanceof ApiError ? err : ApiError.badRequest('تعذّرت معالجة الصورة المرفوعة'));
  }
}

export const uploadProductImage = {
  single: (field: string) => [memoryUpload.single(field), verifyAndPersistImage],
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Public URL of the persisted upload when STORAGE_DRIVER=s3; unset
       *  (and unused) on the default local-disk driver, where controllers
       *  keep building the URL from req.file.path as before. */
      fileUrl?: string;
    }
  }
}
