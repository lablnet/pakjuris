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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const maxReconnectAttempts = apiConfig.connection.maxReconnectAttempts;

  const connectSSE = async () => {
    setConnectionError(null);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const token = await getToken();

    try {
      const apiBase = apiConfig.apiBaseUrl;
      const endpoint = apiConfig.endpoints.status(clientId);
      const eventSourceUrl = `${apiBase}${endpoint}`;

      const eventSource = new EventSource(eventSourceUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StatusUpdate = JSON.parse(event.data);
          setStatusUpdates(prev => [...prev, data]);
          setCurrentStatus(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setConnectionError('SSE connection error. Attempting to reconnect...');

        eventSource.close();
        eventSourceRef.current = null;

        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const baseDelay = Math.min(
            apiConfig.connection.initialRetryDelay * 2 ** reconnectAttemptRef.current,
            apiConfig.connection.maxRetryDelay
          );
          const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1);
          const backoffTime = Math.max(1000, baseDelay + jitter);

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connectSSE();
          }, backoffTime);
        } else {
          setConnectionError('Failed to connect after multiple attempts. Please try again later.');
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionError('Failed to create SSE connection.');
    }
  };

  useEffect(() => {
    connectSSE();

    const unsubscribe = auth.onAuthStateChanged(() => {
      connectSSE();
    });

    return () => {
      unsubscribe();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [clientId]); // Dependency on clientId to reconnect when it changes

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
