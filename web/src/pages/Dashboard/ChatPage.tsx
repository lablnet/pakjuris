import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import StatusDisplay from '../../components/status/StatusDisplay';
import useChat from '../../hooks/chat/useChat';
import usePDFViewer from '../../hooks/pdf/usePDFViewer';

export default function ChatPage() {
  // Get conversation ID from URL params
  const { conversationId } = useParams<{ conversationId: string }>();
  
  const {
    question,
    setQuestion,
    chatHistory,
    isLoading,
    handleAsk,
    chatEndRef,
    currentStatus,
    conversationId: activeConversationId,
    handleSelectConversation,
    startNewChat
  } = useChat(conversationId);
  
  const {
    currentPdfUrl,
    setCurrentPdfUrl,
    currentHighlightText,
    setCurrentHighlightText,
    currentHighlightPage,
    setCurrentHighlightPage,
    currentNumPages,
    pdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    scale,
    zoomIn,
    zoomOut,
    resetZoom
  } = usePDFViewer();

  // Add state to track the active message
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debug status updates
  useEffect(() => {
      console.log('ChatPage UI Status Update:', currentStatus);
  }, [currentStatus]);

  // Debug PDF viewer props
  useEffect(() => {
    console.log('ChatPage PDF props for messages:', {
      currentPdfUrl,
      currentHighlightText,
      currentHighlightPage,
      chatHistoryLength: chatHistory.length
    });
  }, [currentPdfUrl, currentHighlightText, currentHighlightPage, chatHistory.length]);

  // When chatHistory changes, set the active message to the last legal query with PDF
  useEffect(() => {
    if (chatHistory.length > 0) {
      const lastLegalQueryIndex = [...chatHistory].reverse().findIndex(
        msg => msg.answer.intent === 'LEGAL_QUERY' && msg.answer.pdfUrl
      );
      
      if (lastLegalQueryIndex !== -1) {
        const actualIndex = chatHistory.length - 1 - lastLegalQueryIndex;
        setActiveMessageIndex(actualIndex);
        
        const message = chatHistory[actualIndex];
        if (message.answer.pdfUrl) {
          console.log("Auto-selecting message on history change:", message);
          setCurrentPdfUrl(message.answer.pdfUrl);
          setCurrentHighlightText(message.answer.originalText || null);
          setCurrentHighlightPage(message.answer.pageNumber || 1);
        }
      }
    }
  }, [chatHistory, setCurrentPdfUrl, setCurrentHighlightText, setCurrentHighlightPage]);

  // Initial selection effect when component mounts
  useEffect(() => {
    if (chatHistory.length > 0 && activeMessageIndex === null) {
      // Find the first legal query with a PDF
      const legalQueryIndex = chatHistory.findIndex(
        msg => msg.answer.intent === 'LEGAL_QUERY' && msg.answer.pdfUrl
      );
      
      if (legalQueryIndex !== -1) {
        const message = chatHistory[legalQueryIndex];
        console.log("Initial selection on mount:", message);
        setActiveMessageIndex(legalQueryIndex);
        setCurrentPdfUrl(message.answer.pdfUrl || null);
        setCurrentHighlightText(message.answer.originalText || null);
        setCurrentHighlightPage(message.answer.pageNumber || 1);
      }
    }
  }, []);

  // Function to handle message click and set it as active
  const handleMessageSelect = (index: number) => {
    const message = chatHistory[index];
    if (message.answer.intent === 'LEGAL_QUERY' && message.answer.pdfUrl) {
      setActiveMessageIndex(index);
      setCurrentPdfUrl(message.answer.pdfUrl);
      setCurrentHighlightText(message.answer.originalText || null);
      setCurrentHighlightPage(message.answer.pageNumber || 1);
      console.log('Selected message:', message);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <MainLayout 
      conversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      startNewChat={startNewChat}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={toggleSidebar}
    >
      <div className="flex flex-col p-4 gap-4 h-full">
        {/* Mobile menu toggle button */}
        <div className="md:hidden flex items-center mb-2">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-white shadow hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Chat History Area */}
        <div className="flex-grow overflow-y-auto bg-gray-50 rounded-2xl p-4 space-y-6">
          <div className="min-h-full">
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-500 italic">
                <p className="text-lg">Ask a question about Pakistani law to begin...</p>
                <p className="text-sm mt-2">Try asking about specific laws, regulations, or legal procedures.</p>
              </div>
            )}
            
            {chatHistory.map((item, idx) => {
              console.log(`Rendering message ${idx}:`, item.answer.originalText);
              return (
                <div
                  key={idx}
                  onClick={() => handleMessageSelect(idx)}
                  className={`cursor-pointer ${activeMessageIndex === idx ? 'ring-2 ring-blue-300 rounded-2xl' : ''}`}
                >
                  <ChatMessage
                    message={{
                      _id: item._id,
                      question: item.question,
                      answer: item.answer
                    }}
                    currentPdfUrl={currentPdfUrl}
                    currentHighlightText={currentHighlightText}
                    currentHighlightPage={currentHighlightPage}
                    currentNumPages={currentNumPages}
                    pdfError={pdfError}
                    onDocumentLoadSuccess={onDocumentLoadSuccess}
                    onDocumentLoadError={onDocumentLoadError}
                    scale={scale}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    resetZoom={resetZoom}
                  />
                </div>
              );
            })}

            {/* Render StatusDisplay OR Loader when isLoading */}
            
            {isLoading ? (
              currentStatus && currentStatus.step ? (
                <div className="my-4">
                  <StatusDisplay 
                    status={{
                      step: currentStatus.step, // Use guaranteed step
                      message: currentStatus.message || '...', // Fallback message
                      output: currentStatus.output
                    }}
                    isConnected={true}
                    connectionError={null}
                    onReconnect={() => {}}
                  />
                </div>
              ) : (
                <div className="flex justify-start my-4">
                  <div className="bg-white text-gray-500 rounded-2xl py-3 px-4 max-w-[80%] shadow-lg border border-gray-100 italic">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <p>🤖 Thinking...</p>
                    </div>
                  </div>
                </div>
              )
            ) : null}
            
            {/* Optionally, display final 'complete' status briefly even after isLoading is false?
                Handled by useSSE timeout currently. If needed, add logic here. */}
            
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          question={question}
          setQuestion={setQuestion}
          handleAsk={handleAsk}
          isLoading={isLoading}
          disabled={false}
        />
      </div>
    </MainLayout>
  );
} 