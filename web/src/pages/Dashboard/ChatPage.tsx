import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import StatusDisplay from '../../components/status/StatusDisplay';
import useChat from '../../hooks/useChat';
import usePDFViewer from '../../hooks/usePDFViewer';

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
    handleSelectConversation
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
  } = usePDFViewer();

  // Add state to track the active message
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);

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
          setCurrentPdfUrl(message.answer.pdfUrl);
          setCurrentHighlightText(message.answer.originalText || null);
          setCurrentHighlightPage(message.answer.pageNumber || 1);
        }
      }
    }
  }, [chatHistory.length]);

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

  return (
    <MainLayout 
      conversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
    >
      <div className="flex flex-col p-4 gap-4 h-full">
        
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
                    message={item}
                    currentPdfUrl={currentPdfUrl}
                    currentHighlightText={currentHighlightText}
                    currentHighlightPage={currentHighlightPage}
                    currentNumPages={currentNumPages}
                    pdfError={pdfError}
                    onDocumentLoadSuccess={onDocumentLoadSuccess}
                    onDocumentLoadError={onDocumentLoadError}
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
                      message: currentStatus.message || '...' // Fallback message
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