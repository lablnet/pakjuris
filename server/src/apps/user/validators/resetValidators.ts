import { body } from 'express-validator';

/**
 * Validation rules for sending reset OTP
 */
export const sendResetOTPValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
];

/**
 * Validation rules for validating OTP
 */
export const validateOTPValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
];

/**
 * Validation rules for updating password
 */
export const updatePasswordValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits'),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('repeat').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];
