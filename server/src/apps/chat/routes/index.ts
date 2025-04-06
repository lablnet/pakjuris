import express from 'express';
import chatRoutes from './chatRoutes';
import statusRoutes from './statusRoutes';
import conversationRoutes from './conversation';

const router = express.Router();

// Mount routes for query and status endpoints
router.use('/query', chatRoutes);
router.use('/status', statusRoutes);
router.use('/conversations', conversationRoutes);

export default router;
