import { useState, useEffect, useRef } from 'react';

interface StatusUpdate {
  step: string;
  message: string;
  intent?: string;
}

const useSSE = () => {
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [currentStatus, setCurrentStatus] = useState<StatusUpdate | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // API base URL from the same place axios is using it
    const apiBase = 'https://us-central1-pakjuris-fa475.cloudfunctions.net/api';
    
    // Create EventSource connection
    const eventSource = new EventSource(`${apiBase}/status/${clientIdRef.current}`);
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

    // Cleanup on unmount
    return () => {
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