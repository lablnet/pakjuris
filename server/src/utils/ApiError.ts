/**
 * Custom API Error class to handle operational errors.
 */
class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  /**
   * Creates an instance of ApiError.
   * 
   * @param message Error message.
   * @param statusCode HTTP status code (default is 500).
   * @param isOperational Indicates if the error is operational (default is true).
   */
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default ApiError;
