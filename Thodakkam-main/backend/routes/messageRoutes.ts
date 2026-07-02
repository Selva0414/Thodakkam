import express from 'express';
const router = express.Router();
import * as messageController from '../controllers/messageController';
import { protectAny } from '../middleware/auth';

// All message routes should be protected
router.use(protectAny);

// POST /api/messages - Send a text message
router.post('/', messageController.sendMessage);

// POST /api/messages/file - Send a file/image message (multipart upload)
router.post('/file', messageController.upload.single('file'), messageController.sendFileMessage);

// POST /api/messages/meet-link - Send a Google Meet link as a chat message
router.post('/meet-link', messageController.sendMeetLink);

// GET /api/messages/conversations - Get list of conversations
router.get('/conversations', messageController.getConversations);

// GET /api/messages/candidates - Get applied candidates as contacts (startup only)
router.get('/candidates', messageController.getCandidateContacts);

// GET /api/messages/:messageId/attachment - Serve attachment binary
router.get('/:messageId/attachment', messageController.getAttachment);

// GET /api/messages/:otherUserId - Get conversation with a specific user
router.get('/:otherUserId', messageController.getConversation);

// PUT /api/messages/delivered/:messageId - Mark a message as delivered
router.put('/delivered/:messageId', messageController.markMessageDelivered);

// PUT /api/messages/seen/:conversationId - Bulk mark a conversation as seen
router.put('/seen/:conversationId', messageController.markConversationSeen);

// PUT /api/messages/unsend/:messageId - Unsend message (sender only)
router.put('/unsend/:messageId', messageController.unsendMessage);

// PUT /api/messages/delete/:messageId - Delete message for me only
router.put('/delete/:messageId', messageController.deleteMessageForMe);

// PUT /api/messages/delete-conversation/:otherUserId - Delete entire conversation for me only
router.put('/delete-conversation/:otherUserId', messageController.deleteConversation);

// PUT /api/messages/edit/:messageId - Edit message (sender only)
router.put('/edit/:messageId', messageController.editMessage);

export default router;
