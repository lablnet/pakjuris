import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import usePDFViewer from './usePDFViewer';
import apiConfig from '../config/api';
import { auth } from '../utils/firebase';
import { useAuthStore } from '../stores/authStore';
import useStatusStore from '../stores/statusStore';
import useSSE from './useSSE';

// Create axios instance
const api = axios.create({
  baseURL: apiConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Update auth token when it changes
const updateAuthToken = async () => {
  try {
    // Use the authStore to get the token
    const { getToken } = useAuthStore.getState();
    const token = await getToken();
    
    if (token) {
      // Add the Bearer prefix to the raw token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return token;
    } else {
      delete api.defaults.headers.common['Authorization'];
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

interface ChatMessage {
  question: string;
  answer: {
    intent: 'GREETING' | 'LEGAL_QUERY' | 'CLARIFICATION_NEEDED' | 'IRRELEVANT' | 'NO_MATCH';
    summary: string;
    title?: string;
    year?: string;
    pageNumber?: number;
    originalText?: string;
    pdfUrl?: string | null;
    matchScore?: number;
  };
}

const useChat = () => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { clientId, clearStatusUpdates } = useSSE();
  const { currentStatus } = useStatusStore();
  const { getToken } = useAuthStore();
  const {
    currentPdfUrl,
    setCurrentPdfUrl,
    currentHighlightText,
    setCurrentHighlightText,
    currentHighlightPage,
    setCurrentHighlightPage,
    currentNumPages,
    setCurrentNumPages,
    pdfError,
    setPdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    clearPDFViewer
  } = usePDFViewer();

  // Get token on mount and when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await updateAuthToken();
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Improved scroll to bottom effect that handles edge cases better
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatEndRef.current) {
        // Use a small timeout to ensure rendering is complete
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ 
            behavior: "smooth",
            block: "end" 
          });
        }, 100);
      }
    };

    scrollToBottom();
    
    // Also scroll when loading state changes or status updates
  }, [chatHistory, isLoading, currentStatus]);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;

    // Update token before making request
    await updateAuthToken();
    
    // Clear status updates using the function from useSSE
    if (typeof clearStatusUpdates === 'function') {
        clearStatusUpdates();
    }

    setIsLoading(true);
    setPdfError(null); // Clear previous PDF errors
    clearPDFViewer(); // Clear PDF viewer

    const userQuestion = question.trim();
    setQuestion(''); // Clear input immediately

    // Optimistically add user question to history
    const newUserMessage = { question: userQuestion, answer: { summary: '...', intent: 'LEGAL_QUERY' } }; // Placeholder answer
    setChatHistory((prev) => [...prev, newUserMessage as ChatMessage]);

    try {
      const res = await api.post('/api/chat/query', {
        question: userQuestion,
        clientId: clientId // Send clientId to server
      });
      const responseData = res.data;

      // Update the last message in history with the actual answer
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1].answer = responseData;
        return updatedHistory;
      });

      // Update PDF viewer state ONLY if it's a legal query with a valid URL
      if (responseData.intent === 'LEGAL_QUERY' && responseData.pdfUrl) {
        console.log("Setting PDF details:", responseData);
        setCurrentPdfUrl(responseData.pdfUrl);
        setCurrentHighlightText(responseData.originalText || null);
        setCurrentHighlightPage(responseData.pageNumber || 1);
        setCurrentNumPages(null); // Reset numPages until PDF loads
      }

    } catch (error) {
      console.error('Error making request:', error);
      let errorMessage = 'Failed to get response. Please try again.';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || 'Server error'}`;
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      // Update the last message to show the error
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        // Ensure the last message exists before trying to update it
        if (updatedHistory.length > 0) {
            updatedHistory[updatedHistory.length - 1].answer = { summary: errorMessage, intent: 'IRRELEVANT'}; // Treat as error display
        }
        return updatedHistory;
      });
      // If there's an error, clear any potentially lingering status
      // Check if clearStatusUpdates is available from useSSE
      if (typeof clearStatusUpdates === 'function') { 
        clearStatusUpdates();
      }
    } finally {
      // Ensure loading is set to false after the try/catch block completes
      setIsLoading(false);
    }
  };

  return {
    question,
    setQuestion,
    chatHistory,
    isLoading,
    currentStatus,
    currentPdfUrl,
    currentHighlightText,
    currentHighlightPage,
    currentNumPages,
    pdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    handleAsk,
    chatEndRef,
    updateAuthToken
  };
};

export { updateAuthToken };
export default useChat; 