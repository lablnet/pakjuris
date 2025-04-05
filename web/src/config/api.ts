const config = {
  apiBaseUrl: "https://us-central1-pakjuris-fa475.cloudfunctions.net/api",
  
  // Generate a unique client ID for the user session
  getClientId: () => `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  
  // Connection settings
  connection: {
    initialRetryDelay: 2000,    // Start with 2s delay
    maxRetryDelay: 60000,       // Max 1 minute between retries
    maxReconnectAttempts: 3,    // Try 3 times at most before giving up
  },
  
  // Helper methods to build full URLs
  endpoints: {
    query: '/query',
    status: (clientId: string) => `/status/${clientId}`
  }
};

export default config; 