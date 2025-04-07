import { useState, useEffect } from 'react';

const usePDFViewer = () => {
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentHighlightText, setCurrentHighlightText] = useState<string | null>(null);
  const [currentHighlightPage, setCurrentHighlightPage] = useState<number>(1);
  const [currentNumPages, setCurrentNumPages] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);

  // Debug: Log when highlights are set
  useEffect(() => {
    console.log("PDFViewer - Highlight text changed:", currentHighlightText);
  }, [currentHighlightText]);

  // Intercept the setter for highlight text to add debugging
  const setHighlightTextWithLogging = (text: string | null) => {
    console.log("Setting highlight text to:", text);
    setCurrentHighlightText(text);
  };

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
    console.log("Clearing PDF viewer state");
    setCurrentPdfUrl(null);
    setCurrentHighlightText(null);
    setCurrentHighlightPage(1);
    setCurrentNumPages(null);
    setPdfError(null);
    setScale(1.0); // Reset scale when clearing the viewer
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0)); // Limit max zoom to 3x
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5)); // Limit min zoom to 0.5x
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  return {
    currentPdfUrl,
    setCurrentPdfUrl,
    currentHighlightText,
    setCurrentHighlightText: setHighlightTextWithLogging,
    currentHighlightPage,
    setCurrentHighlightPage,
    currentNumPages,
    setCurrentNumPages,
    pdfError,
    setPdfError,
    onDocumentLoadSuccess,
    onDocumentLoadError,
    clearPDFViewer,
    scale,
    zoomIn,
    zoomOut,
    resetZoom
  };
};

export default usePDFViewer;
