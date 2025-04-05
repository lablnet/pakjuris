import { useState, useEffect, useRef } from 'react';
import apiConfig from '../config/api';
import { auth } from '../utils/firebase';

interface StatusUpdate {
  step: string;
  message: string;
  intent?: string;
}

const useSSE = () => {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [currentStatus, setCurrentStatus] = useState<StatusUpdate | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>(apiConfig.getClientId());
  
  useEffect(() => {
    const connectSSE = async () => {
      // Use API config for base URL
      const apiBase = apiConfig.apiBaseUrl;
      
      // Get token directly from Firebase if user is logged in
      let token = null;
      const user = auth.currentUser;
      if (user) {
        try {
          token = await user.getIdToken(true);
          localStorage.setItem('authToken', token);
        } catch (err) {
          console.error('Error getting Firebase token:', err);
        }
      }
      
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Create EventSource connection with token in URL (since EventSource can't set headers)
      const eventSourceUrl = `${apiBase}${apiConfig.endpoints.status(clientIdRef.current)}${token ? `?token=${token}` : ''}`;
      const eventSource = new EventSource(eventSourceUrl);
      eventSourceRef.current = eventSource;

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
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
        eventSource.close();
      };
    };
    
    // Connect to SSE
    connectSSE();
    
    // Auth state listener to reconnect when auth changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      connectSSE();
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
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
    clientId: clientIdRef.current,
    clearStatusUpdates
  };
};

export default useSSE; 