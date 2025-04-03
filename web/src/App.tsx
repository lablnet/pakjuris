import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

interface ChatMessage {
  question: string;
  answer: {
      intent: 'GREETING' | 'LEGAL_QUERY' | 'CLARIFICATION_NEEDED' | 'IRRELEVANT' | 'NO_MATCH'; // Add NO_MATCH possibility
      summary: string;
      title?: string;
      year?: string;
      pageNumber?: number;
      originalText?: string;
      pdfUrl?: string | null;
      matchScore?: number;
  };
}

export default function App() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null); // To scroll chat to bottom

  // State specific to the currently displayed PDF (if any)
  // We only update these when a LEGAL_QUERY with a pdfUrl arrives
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentHighlightText, setCurrentHighlightText] = useState<string | null>(null);
  const [currentHighlightPage, setCurrentHighlightPage] = useState<number>(1);
  const [currentNumPages, setCurrentNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);


  // Scroll to bottom of chat on new message
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleAsk = async () => {
      if (!question.trim() || isLoading) return;

      setIsLoading(true);
      setPdfError(null); // Clear previous PDF errors
      const userQuestion = question.trim();
      setQuestion(''); // Clear input immediately

      // Optimistically add user question to history
      const newUserMessage = { question: userQuestion, answer: { summary: '...', intent: 'LEGAL_QUERY' } }; // Placeholder answer
      setChatHistory((prev) => [...prev, newUserMessage as ChatMessage]);


      try {
          const res = await api.post('/query', { question: userQuestion });
          const responseData = res.data;

          // Update the last message in history with the actual answer
          setChatHistory((prev) => {
              const updatedHistory = [...prev];
              updatedHistory[updatedHistory.length - 1].answer = responseData;
              return updatedHistory;
          });

          // Update PDF viewer state ONLY if it's a legal query with a valid URL
          if (responseData.intent === 'LEGAL_QUERY' && responseData.pdfUrl) {
              console.log("Setting PDF details:", responseData);
              setCurrentPdfUrl(responseData.pdfUrl);
              setCurrentHighlightText(responseData.originalText || null);
              setCurrentHighlightPage(responseData.pageNumber || 1);
              setCurrentNumPages(null); // Reset numPages until PDF loads
          } else {
              // If not a legal query with PDF, clear the viewer section
               setCurrentPdfUrl(null);
               setCurrentHighlightText(null);
               setCurrentHighlightPage(1);
               setCurrentNumPages(null);
          }

      } catch (error) {
          console.error('Error making request:', error);
          let errorMessage = 'Failed to get response. Please try again.';
          if (axios.isAxiosError(error) && error.response) {
              errorMessage = `Error: ${error.response.status} - ${error.response.data?.message || 'Server error'}`;
          } else if (error instanceof Error) {
              errorMessage = `Error: ${error.message}`;
          }
          // Update the last message to show the error
           setChatHistory((prev) => {
              const updatedHistory = [...prev];
              updatedHistory[updatedHistory.length - 1].answer = { summary: errorMessage, intent: 'IRRELEVANT'}; // Treat as error display
              return updatedHistory;
          });
           // Clear PDF view on error
           setCurrentPdfUrl(null);
           setCurrentHighlightText(null);
      } finally {
          setIsLoading(false);
      }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
      console.log(`PDF loaded successfully with ${numPages} pages.`);
      setCurrentNumPages(numPages);
      setPdfError(null); // Clear error on success
  }

  function onDocumentLoadError(error: Error): void {
      console.error("Error loading PDF:", error);
      setPdfError(`Failed to load PDF: ${error.message}. Check the URL or network connection.`);
       // Optionally clear the PDF display state
       setCurrentPdfUrl(null);
       setCurrentHighlightText(null);
       setCurrentNumPages(null);
  }


  return (
      <div className="flex flex-col h-screen bg-gray-100">
          {/* Header */}
          <header className="bg-gray-800 text-white p-3 shadow-md">
              <h1 className="text-xl font-bold">🇵🇰 Pakistani Law Chatbot</h1>
          </header>

          {/* Main Content Area */}
          <div className="flex-grow overflow-hidden flex flex-col p-4 gap-4">

              {/* Chat History Area */}
              <div className="flex-grow overflow-y-auto bg-white shadow rounded-lg p-4 space-y-6">
                  {chatHistory.length === 0 && (
                      <p className="text-center text-gray-500 italic">Ask a question about Pakistani law to begin...</p>
                  )}
                  {chatHistory.map((item, idx) => (
                      <div key={idx}>
                          {/* User Question */}
                          <div className="flex justify-end">
                              <p className="bg-blue-100 text-blue-900 rounded-lg py-2 px-4 max-w-[80%] shadow-sm">
                                   {item.question}
                               </p>
                          </div>

                          {/* Bot Response */}
                          <div className="mt-2">
                              {/* Simple Response (No PDF or Not Legal Query) */}
                              {item.answer.intent !== 'LEGAL_QUERY' || !item.answer.pdfUrl ? (
                                   <div className="flex justify-start">
                                       <p className="bg-gray-100 text-gray-800 rounded-lg py-2 px-4 max-w-[80%] shadow-sm border border-gray-200">
                                           🤖 {item.answer.summary}
                                       </p>
                                   </div>
                              ) : (
                                  // Split Response (Legal Query with PDF)
                                  <div className="flex gap-4 bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-200">
                                      {/* Left Pane: Summary */}
                                      <div className="w-1/2 flex-shrink-0">
                                          <p className="text-gray-800 whitespace-pre-wrap">🤖 {item.answer.summary}</p>
                                          {item.answer.title && (
                                              <small className="block mt-2 text-xs text-gray-500 italic">
                                                  📖 Source: {item.answer.title} ({item.answer.year}), Page {item.answer.pageNumber}
                                                  {item.answer.matchScore && ` (Score: ${item.answer.matchScore.toFixed(3)})`}
                                              </small>
                                          )}
                                      </div>

                                      {/* Right Pane: PDF Preview + Highlight */}
                                      {/* We show this pane only if the *current* PDF matches the one for *this* answer */}
                                      {currentPdfUrl === item.answer.pdfUrl && (
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
                  ))}
                  {/* Loader */}
                  {isLoading && (
                       <div className="flex justify-start">
                           <p className="bg-gray-100 text-gray-500 rounded-lg py-2 px-4 max-w-[80%] shadow-sm border border-gray-200 italic">
                               🤖 Thinking...
                           </p>
                       </div>
                   )}
                  <div ref={chatEndRef} /> {/* Element to scroll to */}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0 flex gap-2 p-2 bg-white rounded-lg shadow">
                  <input
                      className="border border-gray-300 rounded-md w-full p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask anything about Pakistani laws..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                      disabled={isLoading}
                  />
                  <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAsk}
                      disabled={!question.trim() || isLoading}
                  >
                      {isLoading ? 'Asking...' : 'Ask'}
                  </button>
              </div>
          </div>
      </div>
  );
}
