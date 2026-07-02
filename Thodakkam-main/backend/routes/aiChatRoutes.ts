import express from 'express';
const router = express.Router();
import multer from 'multer';
import * as aiChatController from '../controllers/aiChatController';

// Use memory storage so the file buffer can be forwarded to the Python AI agent
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/history/:userId', aiChatController.getHistory);
router.post('/message', upload.single('file'), aiChatController.sendMessage);

export default router;
