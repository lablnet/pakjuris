import express from 'express';
import * as conversationController from '../controller/conversation';

const router = express.Router();

// Get all conversations for the authenticated user
router.get('/', conversationController.getConversations);

// Get all archived conversations for the authenticated user
router.get('/archived', conversationController.getArchivedConversations);

// Get a specific conversation by ID
router.get('/:id', conversationController.getConversation);

// Create a new conversation
router.post('/', conversationController.createConversation);

// Update a conversation
router.put('/:id', conversationController.updateConversation);

// Delete a conversation
router.delete('/:id', conversationController.deleteConversation);

// Archive/unarchive a conversation
router.patch('/:id/archive', conversationController.archiveConversation);

// Share a conversation
router.post('/:id/share', conversationController.shareConversation);

export default router;
