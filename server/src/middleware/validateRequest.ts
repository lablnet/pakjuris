import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import formatErrorResponse from '../utils/errorFormatter';

/**
 * Middleware to validate requests based on provided validation chains.
 * 
 * @param validations Array of express-validator validation chains.
 * 
 * @returns Express middleware function.
 * @since v1.0.0
 */
const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validation chains
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Gather validation results
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format and send validation errors
    res.status(400).json(formatErrorResponse(errors.array(), true));
  };
};

export default validateRequest;
