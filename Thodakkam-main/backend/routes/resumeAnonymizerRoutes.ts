import express from "express";
import multer from "multer";
import { anonymizeResume } from "../controllers/resumeAnonymizerController";
import { protect } from "../middleware/auth";

const router = express.Router();

// Memory storage — forward the buffer directly to Render (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

// POST /api/ai/anonymize-resume  (auth required)
router.post("/anonymize-resume", protect, upload.single("file"), anonymizeResume);

export default router;
