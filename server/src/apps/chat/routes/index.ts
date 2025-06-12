import express from 'express';
import chatRoutes from './chatRoutes';
import conversationRoutes from './conversation';
import feedbackRoutes from './feedbackRoutes';

const router = express.Router();

// Mount routes for query and status endpoints
router.use('/query', chatRoutes);
router.use('/conversations', conversationRoutes);
router.use('/feedback', feedbackRoutes);

export default router;
