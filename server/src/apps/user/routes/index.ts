import express from 'express';
import authRoutes from './authRoutes';
import resetRoutes from './resetRoutes';
import userRoutes from './userRoutes';

const router = express.Router();

// Mounting the routes.
router.use('/auth', authRoutes);
router.use('/auth/reset', resetRoutes);
router.use('/user', userRoutes);

export default router;
