import { useState, useEffect, useRef } from 'react';
import apiConfig from '../config/api';
import { auth } from '../utils/firebase';
import { useAuthStore } from '../stores/authStore';
import { fetchEventSource } from '@microsoft/fetch-event-source';

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

  const { clientId, getToken } = useAuthStore();
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = apiConfig.connection.maxReconnectAttempts;
  const reconnectTimeoutRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const connectSSE = async () => {
    console.log('Connecting to SSE...');
    setConnectionError(null);

    // Abort existing connection if present
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const token = await getToken();
    const apiBase = apiConfig.apiBaseUrl;
    const url = apiBase + apiConfig.endpoints.status(clientId);

    controllerRef.current = new AbortController();

    try {
      await fetchEventSource(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controllerRef.current.signal,

        // @ts-ignore
        onopen(res) {
          if (res.ok && res.status === 200) {
            console.log('SSE connection opened successfully');
            setIsConnected(true);
            reconnectAttemptRef.current = 0;
          } else {
            throw new Error(`Failed to connect: ${res.status}`);
          }
        },

        onmessage(event) {
          try {
            console.log('SSE raw event received:', event.data);
            const data = JSON.parse(event.data);

            setStatusUpdates((prev) => [...prev, data]);
            setCurrentStatus(data);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        },

        onerror(err) {
          console.error('SSE connection error:', err);
          setIsConnected(false);
          setConnectionError('SSE connection error. Attempting to reconnect...');

          if (reconnectAttemptRef.current < maxReconnectAttempts) {
            const baseDelay = Math.min(
              apiConfig.connection.initialRetryDelay *
                Math.pow(2, reconnectAttemptRef.current),
              apiConfig.connection.maxRetryDelay
            );

            const jitter = baseDelay * 0.3 * (Math.random() * 2 - 1);
            const backoffTime = Math.max(1000, baseDelay + jitter);

            console.log(
              `Reconnecting in ${Math.round(backoffTime)}ms (attempt ${
                reconnectAttemptRef.current + 1
              }/${maxReconnectAttempts})`
            );

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = window.setTimeout(() => {
              reconnectAttemptRef.current += 1;
              connectSSE();
            }, backoffTime);
          } else {
            setConnectionError(
              'Failed to connect to status updates after multiple attempts. Please try again later.'
            );
          }

          throw err;
        },
      });
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionError('Failed to create SSE connection');
    }
  };

  useEffect(() => {
    connectSSE();

    const unsubscribe = auth.onAuthStateChanged(() => {
      connectSSE();
    });

    return () => {
      unsubscribe();
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

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
    reconnect: connectSSE,
  };
};

export default useSSE;