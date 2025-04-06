import express from 'express';
import { establishConnection } from '../controller/status';

const router = express.Router();

// SSE endpoint to establish connection
router.get('/:clientId', establishConnection);

export default router;
