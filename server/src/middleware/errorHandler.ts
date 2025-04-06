import { Request, Response, NextFunction } from 'express';
import formatErrorResponse from '../utils/errorFormatter';
import ApiError from '../utils/ApiError';

/**
 * Middleware to handle errors and send a formatted response.
 * 
 * @param err - Error object.
 * @param req - Express Request object.
 * 
 * @returns Express Response object.
 * @since v1.0.0
 */
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error Handler:', err);
  console.log('Is ApiError:', err instanceof ApiError); 
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(formatErrorResponse(err));
    return;
  }

  res.status(500).json(formatErrorResponse({ message: 'Internal Server Error' }));
};

export default errorHandler;
