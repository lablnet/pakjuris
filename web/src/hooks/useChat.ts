import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import usePDFViewer from './usePDFViewer';
import useStatusStore from '../stores/statusStore';
import useSSE from './useSSE';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';


interface ChatMessage {
  question: string;
  answer: {
    intent: 'GREETING' | 'LEGAL_QUERY' | 'CLARIFICATION_NEEDED' | 'IRRELEVANT' | 'NO_MATCH' | 'DISCUSSION';
    summary: string;
    title?: string;
    year?: string;
    pageNumber?: number;
    originalText?: string;
    pdfUrl?: string | null;
    matchScore?: number;
  };
}

const useChat = (initialConversationId?: string) => {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { clientId, clearStatusUpdates } = useSSE();
  const { currentStatus } = useStatusStore();

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

  // Load conversation messages if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setChatHistory([]);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      const response = await api.chat.conversations.get(convId);
      const conversation = response;
      
      // Transform messages to chat history format
      const messages = conversation.messages || [];
      const formattedHistory: ChatMessage[] = [];
      console.log("MESSAGES", messages);
      for (let i = 0; i < messages.length; i += 2) {
        const userMsg = messages[i];
        const assistantMsg = messages[i + 1];
        
        if (userMsg && assistantMsg && userMsg.role === 'user' && assistantMsg.role === 'assistant') {
          formattedHistory.push({
            question: userMsg.content,
            answer: {
              intent: assistantMsg.metadata?.intent || 'LEGAL_QUERY',
              summary: assistantMsg.content,
              title: assistantMsg.metadata?.title,
              year: assistantMsg.metadata?.year,
              pageNumber: assistantMsg.metadata?.pageNumber,
              originalText: assistantMsg.metadata?.originalText,
              pdfUrl: assistantMsg.metadata?.pdfUrl,
              matchScore: assistantMsg.metadata?.matchScore
            }
          });
        }
      }
      
      setChatHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await api.chat.query({
        question: userQuestion,
        clientId: clientId, // Send clientId to server
        conversationId: conversationId // Send conversationId if it exists
      });
      const responseData = res.data;

      // Update the conversation ID if this is a new conversation
      if (responseData.conversationId && !conversationId) {
        setConversationId(responseData.conversationId);
        // Update URL to include conversation ID
        navigate(`/chat/${responseData.conversationId}`, { replace: true });
      }

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

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    navigate(`/chat/${id}`);
  };

  const startNewChat = () => {
    setConversationId(undefined);
    setChatHistory([]);
    navigate('/chat');
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
    conversationId,
    handleSelectConversation,
    startNewChat
  };
};

export default useChat;
