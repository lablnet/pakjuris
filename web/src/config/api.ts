const config = {
  apiBaseUrl: "http://localhost:8000",
  
  // Connection settings
  connection: {
    initialRetryDelay: 2000,    // Start with 2s delay
    maxRetryDelay: 60000,       // Max 1 minute between retries
    maxReconnectAttempts: 3,    // Try 3 times at most before giving up
  },
  
  // API endpoints
  endpoints: {
    query: "/query",
    status: (clientId: string) => `/status/${clientId}`,
  }
};

export default config; 