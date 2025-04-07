import express from 'express';
import { createFeedback, getFeedback } from '../controller/feedback';

const router = express.Router();

// Create or update feedback
router.post('/', createFeedback);

// Get feedback for a specific message
router.get('/:messageId', getFeedback);

export default router;
