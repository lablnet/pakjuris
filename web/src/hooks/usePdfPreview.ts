import { useState } from 'react';

interface UsePdfPreviewProps {
  pdfUrl: string | null;
  originalText: string | null;
  currentPdfUrl: string | null;
  currentHighlightText: string | null;
}

const usePdfPreview = ({
  pdfUrl,
  originalText,
  currentPdfUrl,
  currentHighlightText
}: UsePdfPreviewProps) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Toggle the PDF preview display
  const togglePdfPreview = () => {
    setShowPdfPreview(prev => !prev);
  };
  
  // Determine which text to highlight
  const getHighlightText = () => {
    // Use message's originalText as highlight text when this message's PDF is shown
    if (currentPdfUrl === pdfUrl) {
      return originalText || currentHighlightText;
    } else if (currentPdfUrl === null && originalText) {
      // Use message's own text if no PDF is currently selected
      return originalText;
    } else {
      return currentHighlightText;
    }
  };
  
  return {
    showPdfPreview,
    togglePdfPreview,
    highlightText: getHighlightText()
  };
};

export default usePdfPreview;
