import express from 'express';
import { me, updateProfile } from '../controller/user';
import authMiddleware from '../../../middleware/authMiddleware';
import asyncHandler from '../../../middleware/asyncHandler';
import validateRequest from '../../../middleware/validateRequest';
import { updateProfileValidation } from '../validators/updateProfileValidator';

const router = express.Router();
router.use(asyncHandler(authMiddleware));

router.get('/me', me);

router.put('/me', validateRequest(updateProfileValidation), updateProfile);

export default router;
