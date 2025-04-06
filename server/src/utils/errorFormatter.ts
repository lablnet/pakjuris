import { ValidationError } from 'express-validator';

/**
 * Interface for formatted individual errors.
 */
interface FormattedError {
  type?: string;
  value?: any;
  msg: string;
  path?: string;
  location?: string;
}

/**
 * Interface for the overall error response.
 */
interface ErrorResponse {
  errors?: FormattedError[];
  message?: string;
}

/**
 * Formats validation errors from express-validator.
 * 
 * @param errors Array of express-validator ValidationError objects.
 * 
 * @returns Formatted error response.
 */
const formatValidationErrors = (errors: ValidationError[]): ErrorResponse => {
  return {
    errors: errors.map((err: any) => ({
      type: 'field',
      value: err.value,
      msg: err.msg,
      path: err.param,
      location: err.location,
    })),
  };
};

/**
 * Formats operational and generic errors.
 * 
 * @param error Error object.
 * 
 * @returns Formatted error response.
 */
const formatOperationalError = (error: any): ErrorResponse => {
  return {
    errors: [
      {
        type: 'general',
        msg: error.message || 'An unexpected error occurred.',
        path: '',
        location: '',
      },
    ],
  };
};

/**
 * Utility function to format errors based on their type.
 * 
 * @param error The error to format.
 * @param isValidation Indicates if the error is a validation error.
 * 
 * @returns Formatted error response.
 */
const formatErrorResponse = (error: any, isValidation: boolean = false): ErrorResponse => {
  if (isValidation && Array.isArray(error)) {
    return formatValidationErrors(error);
  } else {
    return formatOperationalError(error);
  }
};

export type { FormattedError, ErrorResponse };
export default formatErrorResponse;
