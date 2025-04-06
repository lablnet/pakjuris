import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import StatusDisplay from '../components/StatusDisplay';
import useChat from '../hooks/useChat';
import useSSE from '../hooks/useSSE';
import usePDFViewer from '../hooks/usePDFViewer';

export default function ChatPage() {
  const {
    question,
    setQuestion,
    chatHistory,
    isLoading,
    handleAsk,
    chatEndRef
  } = useChat();
  
  const {
    currentStatus,
  } = useSSE();
  
  const {
    currentPdfUrl,
    currentHighlightText,
    currentHighlightPage,
    currentNumPages,
    pdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
  } = usePDFViewer();

  return (
    <MainLayout>
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
            
            {chatHistory.map((item, idx) => (
              <ChatMessage
                key={idx}
                message={item}
                currentPdfUrl={currentPdfUrl}
                currentHighlightText={currentHighlightText}
                currentHighlightPage={currentHighlightPage}
                currentNumPages={currentNumPages}
                pdfError={pdfError}
                onDocumentLoadSuccess={onDocumentLoadSuccess}
                onDocumentLoadError={onDocumentLoadError}
              />
            ))}

            {/* Status Updates */}
            {isLoading && currentStatus && (
              <StatusDisplay 
                status={currentStatus} 
                isConnected={true}
                connectionError={null}
                onReconnect={() => {}}
              />
            )}

            {/* Loader */}
            {isLoading && !currentStatus && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 rounded-2xl py-3 px-4 max-w-[80%] shadow-lg border border-gray-100 italic">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <p>🤖 Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            
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