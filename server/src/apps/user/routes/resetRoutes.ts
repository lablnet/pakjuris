// src/apps/user/routes/resetRoutes.ts

import express from 'express';
import { sendResetOTP, validateOTP, updatePassword } from '../controller/reset';
import validateRequest from '../../../middleware/validateRequest';
import {
  sendResetOTPValidation,
  validateOTPValidation,
  updatePasswordValidation,
} from '../validators/resetValidators';
import rateLimiter from '../../../middleware/rateLimiter';

const router = express.Router();

/**
 * Rate limiter configuration for password reset routes
 * 5 requests per 15 minutes per email
 */
const resetRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many password reset attempts, please try again after 15 minutes.',
  keyGenerator: (req) => req.body.email || req.ip,
});

/**
 * Send Reset OTP
 */
router.post(
  '/send-otp',
  resetRateLimiter,
  validateRequest(sendResetOTPValidation),
  sendResetOTP
);

/**
 * Validate OTP
 */
router.post(
  '/validate-otp',
  resetRateLimiter,
  validateRequest(validateOTPValidation),
  validateOTP
);

/**
 * Update Password
 */
router.post(
  '/update-password',
  resetRateLimiter,
  validateRequest(updatePasswordValidation),
  updatePassword
);

export default router;
