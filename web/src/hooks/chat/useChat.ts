import { useState, useRef, useEffect } from 'react';
import usePDFViewer from '../pdf/usePDFViewer';
import useStatusStore from '../../stores/statusStore';
import { useNavigate } from 'react-router-dom';
import { api, baseURL } from '../../services/api';


interface ChatMessage {
  _id?: string; // Add ID for feedback functionality
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
  
  const { setCurrentStatus, currentStatus } = useStatusStore();

  const {
    currentPdfUrl,
    setCurrentPdfUrl,
    currentHighlightText,
    setCurrentHighlightText,
    currentHighlightPage,
    setCurrentHighlightPage,
    currentNumPages,
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
            _id: assistantMsg._id, // Include the message ID for feedback
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

      // Set the PDF viewer state to the last legal query with a PDF
      // Do this AFTER setting chat history to ensure we have the most recent state
      setTimeout(() => {
        if (formattedHistory.length > 0) {
          const lastLegalQuery = [...formattedHistory].reverse().find(
            msg => msg.answer.intent === 'LEGAL_QUERY' && msg.answer.pdfUrl && msg.answer.originalText
          );

          if (lastLegalQuery) {
            console.log("Setting PDF viewer state from conversation history:", lastLegalQuery);
            setCurrentPdfUrl(lastLegalQuery.answer.pdfUrl || null);
            setCurrentHighlightText(lastLegalQuery.answer.originalText || null);
            setCurrentHighlightPage(lastLegalQuery.answer.pageNumber || 1);
          }
        }
      }, 0);
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
  }, [chatHistory, isLoading]);

  const handleAsk = async () => {
    if (!question.trim() || isLoading) return;
    
    // Clear status updates
    setCurrentStatus(null);

    setIsLoading(true);
    setPdfError(null); // Clear previous PDF errors
    clearPDFViewer(); // Clear PDF viewer

    const userQuestion = question.trim();
    setQuestion(''); // Clear input immediately

    // Optimistically add user question to history
    const newUserMessage = { question: userQuestion, answer: { summary: '...', intent: 'LEGAL_QUERY' } };
    setChatHistory((prev) => [...prev, newUserMessage as ChatMessage]);

    try {
      // Use the new RAG endpoint with streaming
      const response = await fetch(`${baseURL}rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add auth if needed
        },
        credentials: 'include',
        body: JSON.stringify({ 
          question: userQuestion,
          conversationId: conversationId 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let finalResult: any = null;
      let finalSources: any[] = [];
      let lastToolOutput: any = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('event: step')) {
              // Skip the event line, the data will be on the next line
              continue;
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Handle step updates for status
                if (data.step && data.output) {
                  console.log('RAG Step:', data.step, data.output);
                  
                  // Extract readable step information
                  let stepMessage = '';
                  if (data.step === 'agent') {
                    // Check if agent is using tools
                    if (data.output.messages && data.output.messages[0] && data.output.messages[0].kwargs && data.output.messages[0].kwargs.tool_calls) {
                      const toolCalls = data.output.messages[0].kwargs.tool_calls;
                      if (toolCalls.length > 0) {
                        const toolName = toolCalls[0].function?.name || 'tool';
                        stepMessage = `Using ${toolName.replace('_', ' ')}...`;
                      } else {
                        stepMessage = 'Processing your question...';
                      }
                    } else {
                      stepMessage = 'Generating response...';
                    }
                  } else if (data.step === 'tools') {
                    // Extract tool output for potential source information
                    if (data.output.messages && data.output.messages[0] && data.output.messages[0].kwargs && data.output.messages[0].kwargs.content) {
                      lastToolOutput = data.output.messages[0].kwargs.content;
                      // Try to parse as JSON to extract sources
                      try {
                        const parsedContent = JSON.parse(lastToolOutput);
                        if (parsedContent.sources && Array.isArray(parsedContent.sources)) {
                          finalSources = parsedContent.sources;
                        }
                      } catch (e) {
                        // Not JSON, continue
                      }
                    }
                    stepMessage = 'Searching legal documents...';
                  } else {
                    stepMessage = `${data.step}...`;
                  }
                  
                  setCurrentStatus({
                    step: data.step,
                    message: stepMessage,
                    output: data.output
                  });
                } 
                // Handle final result
                else if (data.final) {
                  console.log('RAG Final Result:', data);
                  finalResult = data.final;
                }
                // Handle final result with sources (alternative format)
                else if (data.summary && data.sources) {
                  console.log('RAG Final Result with sources:', data);
                  finalResult = data.summary;
                  finalSources = data.sources;
                }
              } catch (e) {
                console.log('Non-JSON line:', line);
              }
            } else if (line.startsWith('event: final')) {
              // Final event indicator
              console.log('Received final event');
            } else if (line.startsWith('event: error')) {
              // Error event
              console.error('RAG Error event received');
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Process the final result
      if (finalResult) {
        console.log("RAG Final Response:", finalResult);
        console.log("RAG Sources:", finalSources);

        // Extract source information if available
        let pdfUrl = null;
        let originalText = null;
        let pageNumber = null;
        let title = null;
        let year = null;

        // Try to parse sources from the final result if it contains source information
        if (typeof finalResult === 'string') {
          // Look for URL pattern in the final result
          const urlMatch = finalResult.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
          if (urlMatch) {
            pdfUrl = urlMatch[2];
            title = urlMatch[1];
            // Extract page number from URL or result text
            const pageMatch = finalResult.match(/Page (\d+)/);
            if (pageMatch) {
              pageNumber = parseInt(pageMatch[1]);
            }
          }
        }

        // If we have sources array, use the first source
        if (finalSources && finalSources.length > 0) {
          const firstSource = finalSources[0];
          pdfUrl = firstSource.url;
          // Extract a reasonable excerpt for highlighting
          if (firstSource.text) {
            const fullText = firstSource.text;
            // Use a reasonable excerpt size (around 300 characters)
            originalText = fullText.length > 300 ? fullText.substring(0, 300) + '...' : fullText;
          }
          pageNumber = firstSource.page || firstSource.pageNumber;
          title = firstSource.title;
          year = firstSource.year;
        }

        // Clear the loading status
        setCurrentStatus(null);

        // Update the last message in history with the actual answer
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1].answer = {
            intent: 'LEGAL_QUERY',
            summary: finalResult,
            title: title || undefined,
            year: year || undefined,
            pageNumber: pageNumber || undefined,
            originalText: originalText || undefined,
            pdfUrl: pdfUrl || undefined,
            matchScore: finalSources.length > 0 ? finalSources[0].score : undefined
          };
          console.log("Updated message history with RAG answer:", updatedHistory[updatedHistory.length - 1]);
          return updatedHistory;
        });

        // Update PDF viewer if we have PDF information
        if (pdfUrl && originalText && pageNumber) {
          console.log("Setting PDF viewer from RAG response:", { pdfUrl, originalText, pageNumber });
          setCurrentPdfUrl(pdfUrl);
          setCurrentHighlightText(originalText);
          setCurrentHighlightPage(pageNumber);
        }
      } else {
        throw new Error('No final result received from RAG endpoint');
      }

    } catch (error) {
      console.error('Error making RAG request:', error);
      let errorMessage = 'Failed to get response. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      // Clear status and show error
      setCurrentStatus(null);
      
      // Update the last message to show the error
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        // Ensure the last message exists before trying to update it
        if (updatedHistory.length > 0) {
            updatedHistory[updatedHistory.length - 1].answer = { summary: errorMessage, intent: 'IRRELEVANT'}; // Treat as error display
        }
        return updatedHistory;
      });
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
    startNewChat,
    currentStatus
  };
};

export default useChat;
