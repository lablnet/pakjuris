import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FeedbackDialog } from '../ui';
import api from '../../services/api';
import { useToast } from '../ui/ToastComp';

interface ChatMessageProps {
  message: {
    _id?: string; // Add message ID for feedback
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
  };
  currentPdfUrl: string | null;
  currentHighlightText: string | null;
  currentHighlightPage: number;
  currentNumPages: number | null;
  pdfError: string | null;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onDocumentLoadError: (error: Error) => void;
  scale?: number;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
}

// Feedback types
type FeedbackStatus = 'liked' | 'disliked' | null;

interface Feedback {
  _id: string;
  status: FeedbackStatus;
  reason?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentPdfUrl,
  currentHighlightText,
  currentHighlightPage,
  currentNumPages,
  pdfError,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  scale = 1.0,
  zoomIn,
  zoomOut,
  resetZoom
}) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();
  
  // Debug logging for highlight text
  useEffect(() => {
    console.log('ChatMessage Props:', { 
      messageText: message.answer.originalText, 
      currentHighlightText, 
      currentPdfUrl: currentPdfUrl, 
      messagePdfUrl: message.answer.pdfUrl,
      currentHighlightPage
    });
  }, [message, currentHighlightText, currentPdfUrl, currentHighlightPage]);
  
  // Use message's originalText as highlight text when this message's PDF is shown
  const highlightText = currentPdfUrl === message.answer.pdfUrl 
    ? message.answer.originalText || currentHighlightText
    : (currentPdfUrl === null && message.answer.originalText) 
      ? message.answer.originalText // Use message's own text if no PDF is currently selected
      : currentHighlightText;
  
  const togglePdfPreview = () => {
    setShowPdfPreview(prev => !prev);
  };

  // Fetch existing feedback if available
  useEffect(() => {
    if (message._id) {
      const fetchFeedback = async () => {
        try {
          const response = await api.chat.feedback.get(message._id!);
          if (response.feedback) {
            setFeedback(response.feedback);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
        }
      };
      
      fetchFeedback();
    }
  }, [message._id]);

  // Handle feedback submission
  const handleFeedback = async (status: FeedbackStatus, reason?: string) => {
    if (!message._id || !status) return;
    
    setIsSubmitting(true);
    try {
      const feedbackData: { 
        messageId: string; 
        status: 'liked' | 'disliked';
        reason?: string;
      } = {
        messageId: message._id,
        status: status
      };
      
      // Only add reason if it's provided and status is disliked
      if (reason && status === 'disliked') {
        feedbackData.reason = reason;
      }
      
      const response = await api.chat.feedback.create(feedbackData);
      
      setFeedback(response.feedback);
      toast({ 
        type: 'success', 
        message: status === 'liked' ? 'Thanks for your feedback!' : 'Thanks for letting us know.'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({ 
        type: 'error', 
        message: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setShowFeedbackDialog(false);
    }
  };

  // Handle like button click
  const handleLike = () => {
    if (feedback?.status) return; // Prevent changing feedback if already submitted
    handleFeedback('liked');
  };

  // Handle dislike button click
  const handleDislike = () => {
    if (feedback?.status) return; // Prevent changing feedback if already submitted
    setShowFeedbackDialog(true);
  };

  // Handle dislike feedback submission
  const handleDislikeFeedback = (reason: string) => {
    handleFeedback('disliked', reason);
  };

  // Copy message text to clipboard
  const handleCopy = () => {
    if (message.answer.summary) {
      navigator.clipboard.writeText(message.answer.summary);
      toast({ type: 'success', message: 'Copied to clipboard' });
    }
  };

  // Determine feedback button styles based on current feedback
  const getLikeButtonClass = () => {
    const baseClass = "p-2 rounded-full transition-colors";
    if (feedback?.status === 'liked') {
      return `${baseClass} text-green-600 bg-green-100`;
    }
    return `${baseClass} text-gray-500 hover:text-green-600 hover:bg-green-50`;
  };

  const getDislikeButtonClass = () => {
    const baseClass = "p-2 rounded-full transition-colors";
    if (feedback?.status === 'disliked') {
      return `${baseClass} text-red-600 bg-red-100`;
    }
    return `${baseClass} text-gray-500 hover:text-red-600 hover:bg-red-50`;
  };

  // Zoom controls component
  const ZoomControls = () => (
    <div className="flex items-center gap-1 text-gray-600">
      <button
        onClick={zoomOut}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="Zoom out"
        disabled={!zoomOut}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="text-xs">{Math.round(scale * 100)}%</span>
      <button
        onClick={resetZoom}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="Reset zoom"
        disabled={!resetZoom}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={zoomIn}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="Zoom in"
        disabled={!zoomIn}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );

  // Mobile zoom controls with larger touch targets
  const MobileZoomControls = () => (
    <div className="flex items-center justify-center gap-3 mt-2 pb-2">
      <button
        onClick={zoomOut}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        title="Zoom out"
        disabled={!zoomOut}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
      <button
        onClick={resetZoom}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        title="Reset zoom"
        disabled={!resetZoom}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={zoomIn}
        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        title="Zoom in"
        disabled={!zoomIn}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 mb-12 mt-6"
    >
      {/* User Question */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end py-3"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl py-4 px-5 max-w-[85%] md:max-w-[80%] shadow-lg my-2">
          <p className="text-sm">{message.question}</p>
        </div>
      </motion.div>

      {/* Bot Response */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-6"
      >
        {/* Simple Response (No PDF or Not Legal Query) */}
        {message.answer.intent !== 'LEGAL_QUERY' || !message.answer.pdfUrl ? (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl py-3 px-4 max-w-[85%] md:max-w-[80%] shadow-lg border border-gray-100">
              <p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">
                🤖 {message.answer.summary}
              </p>
              
              {/* Feedback and Copy buttons */}
              <div className="flex items-center justify-end mt-3 space-x-1 border-t pt-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Copy to clipboard"
                  disabled={isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handleLike}
                  className={getLikeButtonClass()}
                  title="Like this response"
                  disabled={!!feedback?.status || isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={handleDislike}
                  className={getDislikeButtonClass()}
                  title="Dislike this response"
                  disabled={!!feedback?.status || isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Split Response (Legal Query with PDF)
          <div className="flex flex-col md:flex-row gap-6 bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
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
                  className="mt-4"
                >
                  <small className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                    📖 Source: {message.answer.title} ({message.answer.year}), Page {message.answer.pageNumber}
                    {message.answer.matchScore && ` (Score: ${message.answer.matchScore.toFixed(3)})`}
                  </small>
                </motion.div>
              )}
              
              {/* Feedback and Copy buttons */}
              <div className="flex items-center justify-end mt-4 space-x-1 border-t pt-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Copy to clipboard"
                  disabled={isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handleLike}
                  className={getLikeButtonClass()}
                  title="Like this response"
                  disabled={!!feedback?.status || isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={handleDislike}
                  className={getDislikeButtonClass()}
                  title="Dislike this response"
                  disabled={!!feedback?.status || isSubmitting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile: Toggle PDF Preview Button */}
              {currentPdfUrl === message.answer.pdfUrl && (
                <div className="mt-5 block md:hidden">
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
                  className="hidden md:flex w-1/2 flex-col border-l border-gray-200 pl-5 gap-3 min-h-[300px] overflow-hidden"
                >
                  <div className="flex justify-between items-center flex-shrink-0">
                    <h3 className="font-semibold text-sm text-gray-700">
                      Document Preview (Page {currentHighlightPage} of {currentNumPages ?? '...'})
                    </h3>
                    <div className="flex items-center gap-2">
                      <ZoomControls />
                      {currentPdfUrl && (
                        <a 
                          href={currentPdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open PDF
                        </a>
                      )}
                    </div>
                  </div>
                  {/* PDF Viewer */}
                  <div className="pdf-container flex-grow border border-gray-200 rounded-lg overflow-auto bg-gray-50 min-h-[200px] flex justify-center items-start">
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
                        {currentNumPages !== null && (
                          <div className="pdf-page-container" style={{ padding: "20px" }}>
                            <Page pageNumber={currentHighlightPage} width={350} scale={scale} />
                          </div>
                        )}
                      </Document>
                    ) : null}
                  </div>
                  {/* Highlighted Text */}
                  {highlightText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex-shrink-0 bg-yellow-50 p-3 rounded-lg shadow-inner border border-yellow-100 overflow-auto max-h-32"
                      onClick={() => console.log('Highlight section clicked, text:', highlightText)}
                    >
                      <h4 className="font-semibold text-xs text-yellow-800 sticky top-0 bg-yellow-50">Relevant Excerpt:</h4>
                      <p className="text-xs text-yellow-900 mt-1">{highlightText}</p>
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
                    className="block md:hidden w-full mt-5 flex flex-col gap-4"
                  >
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-gray-700">
                          Document Preview (Page {currentHighlightPage} of {currentNumPages ?? '...'})
                        </h3>
                        {currentPdfUrl && (
                          <a 
                            href={currentPdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open PDF
                          </a>
                        )}
                      </div>
                      
                      {/* Mobile Zoom Controls */}
                      <MobileZoomControls />
                      
                      {/* Mobile PDF Viewer */}
                      <div className="pdf-container mt-2 border border-gray-200 rounded-lg overflow-auto bg-gray-50 flex justify-center items-start p-3">
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
                            {currentNumPages !== null && (
                              <div className="pdf-page-container overflow-visible" style={{ padding: "24px", minHeight: "400px" }}>
                                <Page 
                                  pageNumber={currentHighlightPage} 
                                  scale={scale}
                                  width={Math.min(window.innerWidth - 60, 600)}
                                  className="shadow-md"
                                />
                              </div>
                            )}
                          </Document>
                        ) : null}
                      </div>
                      
                      {/* Mobile Highlighted Text */}
                      {highlightText && (
                        <div 
                          className="mt-3 bg-yellow-50 p-3 rounded-lg shadow-inner border border-yellow-100 overflow-auto"
                          onClick={() => console.log('Mobile highlight section clicked, text:', highlightText)}
                        >
                          <h4 className="font-semibold text-xs text-yellow-800 sticky top-0 bg-yellow-50">Relevant Excerpt:</h4>
                          <p className="text-xs text-yellow-900 mt-1">{highlightText}</p>
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

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        onSubmit={handleDislikeFeedback}
        title="Please tell us why you disliked this response"
      />
    </motion.div>
  );
};

export default ChatMessage; 