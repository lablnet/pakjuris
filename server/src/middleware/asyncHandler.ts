import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an asynchronous middleware function and ensures that any errors are passed to next().
 * @param fn - The asynchronous middleware function to wrap.
 * 
 * @returns A new middleware function.
 * @since v1.0.0
 */
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
