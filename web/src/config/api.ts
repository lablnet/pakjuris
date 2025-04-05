const config = {
  apiBaseUrl: "https://us-central1-pakjuris-fa475.cloudfunctions.net/api",
  
  // Generate a unique client ID for the user session
  getClientId: () => `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  
  // Helper methods to build full URLs
  endpoints: {
    query: '/query',
    status: (clientId: string) => `/status/${clientId}`
  }
};

export default config; 