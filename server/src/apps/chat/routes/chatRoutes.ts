import express from 'express';
import { processQuery } from '../controller/chat';

const router = express.Router();

// Query endpoint
router.post('/', processQuery);

export default router;
