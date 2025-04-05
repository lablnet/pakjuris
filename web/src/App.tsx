import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Import components
import MainLayout from './layouts/MainLayout';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import StatusDisplay from './components/StatusDisplay';
import useChat from './hooks/useChat';

// Import pages
import Home from './pages/index';
import About from './pages/About';

function ChatPage() {
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
    <div className="flex-grow overflow-hidden flex flex-col p-4 gap-4 h-full">
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
            <StatusDisplay status={currentStatus} />
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
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
