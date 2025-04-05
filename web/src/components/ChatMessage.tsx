import React from 'react';
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
    <div>
      {/* User Question */}
      <div className="flex justify-end">
        <p className="bg-blue-100 text-blue-900 rounded-lg py-2 px-4 max-w-[80%] shadow-sm">
          {message.question}
        </p>
      </div>

      {/* Bot Response */}
      <div className="mt-2">
        {/* Simple Response (No PDF or Not Legal Query) */}
        {message.answer.intent !== 'LEGAL_QUERY' || !message.answer.pdfUrl ? (
          <div className="flex justify-start">
            <p className="bg-gray-100 text-gray-800 rounded-lg py-2 px-4 max-w-[80%] shadow-sm border border-gray-200">
              🤖 {message.answer.summary}
            </p>
          </div>
        ) : (
          // Split Response (Legal Query with PDF)
          <div className="flex gap-4 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
            {/* Left Pane: Summary */}
            <div className="w-1/2 flex-shrink-0">
              <p className="text-gray-800 whitespace-pre-wrap">🤖 {message.answer.summary}</p>
              {message.answer.title && (
                <small className="block mt-2 text-xs text-gray-500 italic">
                  📖 Source: {message.answer.title} ({message.answer.year}), Page {message.answer.pageNumber}
                  {message.answer.matchScore && ` (Score: ${message.answer.matchScore.toFixed(3)})`}
                </small>
              )}
            </div>

            {/* Right Pane: PDF Preview + Highlight */}
            {/* We show this pane only if the *current* PDF matches the one for *this* answer */}
            {currentPdfUrl === message.answer.pdfUrl && (
              <div className="w-1/2 flex flex-col border-l border-gray-300 pl-4 gap-2 min-h-[300px] overflow-hidden">
                <h3 className="font-semibold text-sm text-gray-700 flex-shrink-0">
                  Document Preview (Page {currentHighlightPage} of {currentNumPages ?? '...'})
                </h3>
                {/* PDF Viewer */}
                <div className="pdf-container flex-grow border border-gray-300 overflow-auto bg-gray-200 min-h-[200px] flex justify-center items-center">
                  {pdfError ? (
                    <p className="text-red-600 p-4 text-center">{pdfError}</p>
                  ) : currentPdfUrl ? (
                    <Document
                      file={currentPdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={<div className="p-4">Loading PDF preview...</div>}
                      error={<div className="p-4 text-red-500">Error loading PDF.</div>}
                    >
                      {currentNumPages !== null && <Page pageNumber={currentHighlightPage} width={350} />}
                    </Document>
                  ) : null}
                </div>
                {/* Highlighted Text */}
                {currentHighlightText && (
                  <div className="flex-shrink-0 bg-yellow-100 p-2 rounded shadow-inner border border-yellow-200 overflow-auto max-h-32">
                    <h4 className="font-semibold text-xs text-yellow-800 sticky top-0 bg-yellow-100">Relevant Excerpt:</h4>
                    <p className="text-xs text-yellow-900">{currentHighlightText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 