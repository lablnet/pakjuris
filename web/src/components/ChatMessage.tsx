import React from 'react';
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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-3 px-4 max-w-[80%] shadow-lg">
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
            <div className="bg-white rounded-2xl py-3 px-4 max-w-[80%] shadow-lg border border-gray-100">
              <p className="text-gray-800 whitespace-pre-wrap">
                🤖 {message.answer.summary}
              </p>
            </div>
          </div>
        ) : (
          // Split Response (Legal Query with PDF)
          <div className="flex gap-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            {/* Left Pane: Summary */}
            <div className="w-1/2 flex-shrink-0">
              <p className="text-gray-800 whitespace-pre-wrap">
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
            </div>

            {/* Right Pane: PDF Preview + Highlight */}
            {currentPdfUrl === message.answer.pdfUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-1/2 flex flex-col border-l border-gray-200 pl-4 gap-2 min-h-[300px] overflow-hidden"
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
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ChatMessage; 