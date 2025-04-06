import { body } from 'express-validator';

/**
 * Validation rules for login
 */
export const loginValidations = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];

/**
 * Validation rules for Signup
 */
export const signupValidations = [
    body("first_name").isString().withMessage("First name is required"),
    body("last_name").isString().withMessage("Last name is required"),
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
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
 * Validation rules for sending OTP
 */
export const otpResend = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required'),
]
