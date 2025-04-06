import express from 'express';
import { signup, login, verifyOTP, logout, resendOTP, refreshAccessToken } from '../controller/auth';
import { loginValidations, signupValidations, validateOTPValidation, otpResend } from '../validators/authValidations';
import validateRequest from '../../../middleware/validateRequest';
import rateLimiter from '../../../middleware/rateLimiter';

const router = express.Router();

const otpRateLimiter = rateLimiter({
    // 30 seconds
    windowMs: 30 * 1000,
    max: 1,
    message: 'Too many password reset attempts, please try again after 15 minutes.',
    keyGenerator: (req) => req.body.email || req.ip,
  });
  

router.post('/signup', validateRequest(signupValidations), signup);
router.post('/login', validateRequest(loginValidations), login);
router.post('/verify-email', validateRequest(validateOTPValidation), verifyOTP);
router.post('/resend-otp', otpRateLimiter, validateRequest(otpResend), resendOTP);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);

export default router;
