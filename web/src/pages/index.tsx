import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import StatusUpdate from '../components/StatusUpdate';
import useChat from '../hooks/useChat';

export default function Home() {
  const {
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
    chatEndRef
  } = useChat();

  return (
    <MainLayout>
      <div className="flex-grow overflow-hidden flex flex-col p-4 gap-4">
        {/* Chat History Area */}
        <div className="flex-grow overflow-y-auto bg-white shadow rounded-lg p-4 space-y-6">
          {chatHistory.length === 0 && (
            <p className="text-center text-gray-500 italic">
              Ask a question about Pakistani law to begin...
            </p>
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
            <StatusUpdate status={currentStatus} />
          )}

          {/* Loader */}
          {isLoading && !currentStatus && (
            <div className="flex justify-start">
              <p className="bg-gray-100 text-gray-500 rounded-lg py-2 px-4 max-w-[80%] shadow-sm border border-gray-200 italic">
                🤖 Thinking...
              </p>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput
          question={question}
          setQuestion={setQuestion}
          handleAsk={handleAsk}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
} 