import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

/**
 * Uses memoryStorage — files are never written to disk.
 * The buffer (req.file.buffer) is converted to base64 and stored in the database.
 * This works correctly in both local dev and production (Railway, Render, etc.)
 * where the filesystem is ephemeral.
 */

// File filter: only allow explicitly whitelisted fields and MIME types
const ALLOWED_IMAGE_FIELDS = new Set(["profilePhoto", "avatarFile", "logo", "logoUrl", "photo", "companyLogo", "physicalPhotos"]);
const ALLOWED_DOC_FIELDS = new Set(["resumeFile", "resume"]);
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.fieldname === "certificateFile") {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype) || ALLOWED_DOC_MIMES.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Only JPEG/PNG/WebP/GIF images or PDF/Word documents are allowed for certificate"));
  }
  if (ALLOWED_IMAGE_FIELDS.has(file.fieldname)) {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Only JPEG/PNG/WebP/GIF images are allowed"));
  }
  if (ALLOWED_DOC_FIELDS.has(file.fieldname)) {
    if (ALLOWED_DOC_MIMES.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Only PDF or Word documents are allowed for resume"));
  }
  return cb(new Error(`Unexpected field: ${file.fieldname}`));
};

const upload = multer({
  storage: multer.memoryStorage(), // Files stored in RAM buffer, never written to disk
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;
