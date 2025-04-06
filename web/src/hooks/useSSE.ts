import { useState, useEffect, useRef, useCallback } from 'react';
import useStatusStore from '../stores/statusStore'

// Bring back the interface if it's used internally
interface StatusUpdate {
  step: string;
  message: string;
  intent?: string;
}

const useSSE = () => {
  // Restore internal state management
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Get the setter function from the store
  const { setCurrentStatus } = useStatusStore(); 

  // Restore clearStatusUpdates logic, using the store setter
  const clearStatusUpdates = useCallback(() => {
    setStatusUpdates([]);
    setCurrentStatus(null); // Use store setter to clear global currentStatus
    console.log('Status updates cleared (Hook)');
  }, [setCurrentStatus]);

  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:8000/api/chat/status/${clientIdRef.current}`, 
      { withCredentials: true }
    );
    eventSourceRef.current = eventSource;
    console.log(`SSE connection initiated with client ID: ${clientIdRef.current} (Hook)`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE Update (Hook):', data);
        
        if (data.message === "SSE connection established" || data.type === "connected") {
          console.log('Connection established, ignoring for UI updates (Hook)');
          return;
        }
        
        if (data.step) {
          console.log('Processing valid status update (Hook):', data);
          
          // Update local history
          setStatusUpdates(prev => [...prev, data]);
          
          // Update global current status via store
          setCurrentStatus(data); 
          console.log('Global current status updated (Hook):', data);
          
          // Restore timeout logic, using the store setter
          if (data.step === 'complete') {
            console.log('Complete step received, setting timeout to clear global status (Hook)');
            setTimeout(() => {
              // Check global state before clearing
              const currentGlobalStatus = useStatusStore.getState().currentStatus;
              if (currentGlobalStatus?.step === 'complete' && currentGlobalStatus?.message === data.message) {
                 console.log('Clearing global current status after timeout (Hook)');
                 setCurrentStatus(null);
              } else {
                 console.log('Global current status changed before timeout, not clearing (Hook)');
              }
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message (Hook):', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error (Hook):', error);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setCurrentStatus(null); // Clear global status on error
    };

    // Restore cleanup
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing SSE connection (Hook)');
        eventSourceRef.current.close();
        // Optionally clear status on disconnect
        // setCurrentStatus(null); 
      }
    };
  // Add setCurrentStatus to dependencies if its identity can change (though unlikely with Zustand)
  }, [setCurrentStatus]); 

  // Return local state and clientId, but NOT currentStatus (it comes from store)
  return {
    statusUpdates,         // Local history
    clientId: clientIdRef.current, // Local client ID
    clearStatusUpdates,    // Function to clear local history and global status
  };
};

export default useSSE;
