// Define the structure of each error object
interface FormattedError {
  type?: string;
  value?: any;
  msg: string;
  path?: string;
  location?: string;
}

// Define the structure of the error response from the backend
interface ErrorResponse {
  errors?: FormattedError[];
  message?: string;
}

// Define the structure of parsed errors
interface ParsedErrors {
  general: string;
  fields: { [key: string]: string };
  errorList: string[];
}

/**
 * Parses error responses from the backend.
 * @param {ErrorResponse} errorResponse - The error response from the backend.
 * 
 * @returns {ParsedErrors} - An object containing general message, field-specific errors, and a list of all errors.
 */
export const parseErrors = (errorResponse: any): ParsedErrors => {
  const parsed: ParsedErrors = {
    general: '',
    fields: {},
    errorList: [],
  };

  // Check if the error is an AxiosError
  if (errorResponse.name === 'AxiosError' && errorResponse.response) {
    errorResponse = errorResponse.response.data;
  }

  if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
    errorResponse.errors.forEach((err: FormattedError) => {
      // Add each error message to the errorList
      parsed.errorList.push(err.msg);

      // Handle field-specific errors
      if (err.type === 'field' && err.path) {
        parsed.fields[err.path] = err.msg;
      } else if (err.type === 'general') {
        parsed.general = err.msg;
      }
    });
  } else if (errorResponse.message) {
    parsed.general = errorResponse.message;
    parsed.errorList.push(errorResponse.message);
  }

  return parsed;
};

/**
 * Generic function to display errors using a toast function.
 * 
 * @param {ErrorResponse} errorResponse - The error response from the backend.
 * 
 * @param {(options: { type: string; message: string }) => void} toast - The toast function to display messages.
 * @since v1.0.0
 */
export const showErrors = (
  errorResponse: any,
  toast: any,
): void => {
  console.log ('Error Response', errorResponse)
  const parsedErrors = parseErrors(errorResponse);
  console.log ('Parsed Errors', parsedErrors)
  // Display a general error message if available
  if (parsedErrors.general) {
    toast({
      type: 'error',
      message: parsedErrors.general,
    });
  }

  // Display field-specific error messages
  for (const [field, message] of Object.entries(parsedErrors.fields)) {
    toast({
      type: 'error',
      message: `${capitalizeFirstLetter(field)}: ${message}`,
    });
  }

  // Additionally, display all error messages as an array
  parsedErrors.errorList.forEach((message) => {
    toast({
      type: 'error',
      message: message,
    });
  });
};

/**
 * Utility function to capitalize the first letter of a string.
 * 
 * @param {string} str - The string to capitalize.
 * 
 * @returns {string} - The capitalized string.
 * @since v1.0.0
 */
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
