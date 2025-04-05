import { useState } from 'react';

const usePDFViewer = () => {
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentHighlightText, setCurrentHighlightText] = useState<string | null>(null);
  const [currentHighlightPage, setCurrentHighlightPage] = useState<number>(1);
  const [currentNumPages, setCurrentNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    console.log(`PDF loaded successfully with ${numPages} pages.`);
    setCurrentNumPages(numPages);
    setPdfError(null); // Clear error on success
  };

  const onDocumentLoadError = (error: Error): void => {
    console.error("Error loading PDF:", error);
    setPdfError(`Failed to load PDF: ${error.message}. Check the URL or network connection.`);
    // Optionally clear the PDF display state
    setCurrentPdfUrl(null);
    setCurrentHighlightText(null);
    setCurrentNumPages(null);
  };

  const clearPDFViewer = () => {
    setCurrentPdfUrl(null);
    setCurrentHighlightText(null);
    setCurrentHighlightPage(1);
    setCurrentNumPages(null);
    setPdfError(null);
  };

  return {
    currentPdfUrl,
    setCurrentPdfUrl,
    currentHighlightText,
    setCurrentHighlightText,
    currentHighlightPage,
    setCurrentHighlightPage,
    currentNumPages,
    setCurrentNumPages,
    pdfError,
    setPdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    clearPDFViewer
  };
};

export default usePDFViewer; 