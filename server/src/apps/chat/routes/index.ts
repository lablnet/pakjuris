import express from 'express';
import chatRoutes from './chatRoutes';
import statusRoutes from './statusRoutes';

const router = express.Router();

// Mount routes for query and status endpoints
router.use('/query', chatRoutes);
router.use('/status', statusRoutes);

export default router;
