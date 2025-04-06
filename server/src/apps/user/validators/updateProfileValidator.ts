import { body } from 'express-validator';

/**
 * Validation rules for updating profile
 */

export const updateProfileValidation = [
    body('full_name')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Full name must be between 1 and 50 characters')
        .optional(),
];
