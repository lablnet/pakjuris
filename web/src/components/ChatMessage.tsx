import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface ChatMessageProps {
  message: {
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
  };
  currentPdfUrl: string | null;
  currentHighlightText: string | null;
  currentHighlightPage: number;
  currentNumPages: number | null;
  pdfError: string | null;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentPdfUrl,
  currentHighlightText,
  currentHighlightPage,
  currentNumPages,
  pdfError,
  onDocumentLoadSuccess,
  onDocumentLoadError
}) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  const togglePdfPreview = () => {
    setShowPdfPreview(prev => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* User Question */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 max-w-[85%] md:max-w-[80%] shadow-lg">
          <p className="text-sm">{message.question}</p>
        </div>
      </motion.div>

      {/* Bot Response */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-2"
      >
        {/* Simple Response (No PDF or Not Legal Query) */}
        {message.answer.intent !== 'LEGAL_QUERY' || !message.answer.pdfUrl ? (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl py-3 px-4 max-w-[85%] md:max-w-[80%] shadow-lg border border-gray-100">
              <p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">
                🤖 {message.answer.summary}
              </p>
            </div>
          </div>
        ) : (
          // Split Response (Legal Query with PDF)
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            {/* Left Pane: Summary */}
            <div className="w-full md:w-1/2 flex-shrink-0">
              <p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">
                🤖 {message.answer.summary}
              </p>
              {message.answer.title && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2"
                >
                  <small className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                    📖 Source: {message.answer.title} ({message.answer.year}), Page {message.answer.pageNumber}
                    {message.answer.matchScore && ` (Score: ${message.answer.matchScore.toFixed(3)})`}
                  </small>
                </motion.div>
              )}
              
              {/* Mobile: Toggle PDF Preview Button */}
              {currentPdfUrl === message.answer.pdfUrl && (
                <div className="mt-3 block md:hidden">
                  <button 
                    onClick={togglePdfPreview}
                    className="w-full bg-blue-50 text-blue-600 rounded-lg py-2 px-3 text-sm font-medium flex justify-center items-center gap-2 hover:bg-blue-100 transition-colors"
                  >
                    {showPdfPreview ? (
                      <>
                        <span>Hide Document</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View Document</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Pane: PDF Preview + Highlight - Desktop always visible, Mobile togglable */}
            {currentPdfUrl === message.answer.pdfUrl && (
              <>
                {/* Desktop view */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="hidden md:flex w-1/2 flex-col border-l border-gray-200 pl-4 gap-2 min-h-[300px] overflow-hidden"
                >
                  <h3 className="font-semibold text-sm text-gray-700 flex-shrink-0">
                    Document Preview (Page {currentHighlightPage} of {currentNumPages ?? '...'})
                  </h3>
                  {/* PDF Viewer */}
                  <div className="pdf-container flex-grow border border-gray-200 rounded-lg overflow-auto bg-gray-50 min-h-[200px] flex justify-center items-center">
                    {pdfError ? (
                      <p className="text-red-600 p-4 text-center">{pdfError}</p>
                    ) : currentPdfUrl ? (
                      <Document
                        file={currentPdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                          <div className="p-4 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Loading PDF preview...</p>
                          </div>
                        }
                        error={<div className="p-4 text-red-500">Error loading PDF.</div>}
                      >
                        {currentNumPages !== null && <Page pageNumber={currentHighlightPage} width={350} />}
                      </Document>
                    ) : null}
                  </div>
                  {/* Highlighted Text */}
                  {currentHighlightText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex-shrink-0 bg-yellow-50 p-3 rounded-lg shadow-inner border border-yellow-100 overflow-auto max-h-32"
                    >
                      <h4 className="font-semibold text-xs text-yellow-800 sticky top-0 bg-yellow-50">Relevant Excerpt:</h4>
                      <p className="text-xs text-yellow-900 mt-1">{currentHighlightText}</p>
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Mobile view - Collapsible */}
                {showPdfPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="block md:hidden w-full mt-3 flex flex-col gap-3"
                  >
                    <div className="border-t border-gray-200 pt-3">
                      <h3 className="font-semibold text-sm text-gray-700">
                        Document Preview (Page {currentHighlightPage} of {currentNumPages ?? '...'})
                      </h3>
                      
                      {/* Mobile PDF Viewer */}
                      <div className="pdf-container mt-2 border border-gray-200 rounded-lg overflow-auto bg-gray-50 flex justify-center items-center">
                        {pdfError ? (
                          <p className="text-red-600 p-4 text-center text-sm">{pdfError}</p>
                        ) : currentPdfUrl ? (
                          <Document
                            file={currentPdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                              <div className="p-4 text-gray-500 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-2 text-sm">Loading PDF...</p>
                              </div>
                            }
                            error={<div className="p-4 text-red-500 text-sm">Error loading PDF.</div>}
                          >
                            {currentNumPages !== null && <Page pageNumber={currentHighlightPage} width={window.innerWidth - 70} />}
                          </Document>
                        ) : null}
                      </div>
                      
                      {/* Mobile Highlighted Text */}
                      {currentHighlightText && (
                        <div className="mt-3 bg-yellow-50 p-3 rounded-lg shadow-inner border border-yellow-100 overflow-auto">
                          <h4 className="font-semibold text-xs text-yellow-800 sticky top-0 bg-yellow-50">Relevant Excerpt:</h4>
                          <p className="text-xs text-yellow-900 mt-1">{currentHighlightText}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage; 