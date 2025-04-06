/**
 * Helper functions for chat operations
 */

/**
 * Formats a chat response with standard properties
 * @param content - The response content
 * @param intent - The detected intent
 */
export const formatChatResponse = (content: string, intent: string = 'GENERAL') => {
  return {
    intent,
    summary: content,
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a status update object
 * @param step - The current processing step
 * @param message - Status message
 * @param additionalData - Any additional data to include
 */
export const createStatusUpdate = (
  step: string, 
  message: string,
  additionalData: Record<string, any> = {}
) => {
  return {
    step,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
};
