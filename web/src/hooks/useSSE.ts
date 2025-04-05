import { useState, useEffect, useRef } from 'react';
import apiConfig from '../config/api';
import { auth } from '../utils/firebase';
import { useAuthStore } from '../stores/authStore';

interface StatusUpdate {
  step: string;
  message: string;
  intent?: string;
}

const useSSE = () => {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [currentStatus, setCurrentStatus] = useState<StatusUpdate | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { clientId, getToken } = useAuthStore();
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = apiConfig.connection.maxReconnectAttempts;
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const connectSSE = async () => {
    console.log("Connecting to SSE...");
    setConnectionError(null);
    
    // Close any existing connection
    if (eventSourceRef.current) {
      console.log("Closing existing SSE connection");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Get token from Zustand store
    const token = await getToken();
    
    try {
      // Construct the URL with clientId from the store
      const apiBase = apiConfig.apiBaseUrl;
      // Pass token in URL parameter - EventSource doesn't support setting headers directly
      const eventSourceUrl = `${apiBase}${apiConfig.endpoints.status(clientId)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      
      console.log(`Creating SSE connection to: ${apiBase}${apiConfig.endpoints.status(clientId)}`);
      
      // Create a new EventSource connection
      const eventSource = new EventSource(eventSourceUrl);
      eventSourceRef.current = eventSource;
      
      // Handle SSE connection open event
      eventSource.onopen = () => {
        console.log("SSE connection opened successfully");
        setIsConnected(true);
        reconnectAttemptRef.current = 0; // Reset reconnect counter on successful connection
      };
      
      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          console.log("SSE raw event received:", event.data);
          const data = JSON.parse(event.data);
          console.log('SSE Update:', data);
          
          // Add to status updates history
          setStatusUpdates(prev => [...prev, data]);
          
          // Update current status
          setCurrentStatus(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionError("SSE connection error. Attempting to reconnect...");
        
        // Close the connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect with exponential backoff and jitter
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          // Base delay with exponential increase (2s, 4s, 8s...)
          const baseDelay = Math.min(
            apiConfig.connection.initialRetryDelay * Math.pow(2, reconnectAttemptRef.current), 
            apiConfig.connection.maxRetryDelay
          );
          
          // Add jitter (±30% randomness) to prevent all clients reconnecting simultaneously
          const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1);
          const backoffTime = Math.max(1000, baseDelay + jitter);
          
          console.log(`Reconnecting in ${Math.round(backoffTime)}ms (attempt ${reconnectAttemptRef.current + 1}/${maxReconnectAttempts})`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connectSSE();
          }, backoffTime);
        } else {
          setConnectionError("Failed to connect to status updates after multiple attempts. Please try again later.");
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionError("Failed to create SSE connection");
    }
  };
  
  // Connect to SSE on component mount
  useEffect(() => {
    connectSSE();
    
    // Auth state listener to reconnect when auth changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      connectSSE();
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (eventSourceRef.current) {
        console.log("Closing SSE connection on unmount");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Clear any pending reconnection attempt
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const clearStatusUpdates = () => {
    setStatusUpdates([]);
    setCurrentStatus(null);
  };

  return {
    statusUpdates,
    currentStatus,
    clientId,
    clearStatusUpdates,
    isConnected,
    connectionError,
    reconnect: connectSSE
  };
};

export default useSSE; 