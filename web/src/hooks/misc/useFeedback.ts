import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ui/ToastComp';

// Feedback types
type FeedbackStatus = 'liked' | 'disliked' | null;

interface Feedback {
  _id: string;
  status: FeedbackStatus;
  reason?: string;
}

const useFeedback = (messageId?: string) => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  
  const toast = useToast();
  
  // Fetch existing feedback if available
  useEffect(() => {
    if (messageId) {
      const fetchFeedback = async () => {
        try {
          const response = await api.chat.feedback.get(messageId);
          if (response.feedback) {
            setFeedback(response.feedback);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
        }
      };
      
      fetchFeedback();
    }
  }, [messageId]);

  // Handle feedback submission
  const handleFeedback = async (status: FeedbackStatus, reason?: string) => {
    if (!messageId || !status) return;
    
    setIsSubmitting(true);
    try {
      const feedbackData: { 
        messageId: string; 
        status: 'liked' | 'disliked';
        reason?: string;
      } = {
        messageId: messageId,
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

  return {
    feedback,
    isSubmitting,
    showFeedbackDialog,
    setShowFeedbackDialog,
    handleLike,
    handleDislike,
    handleDislikeFeedback,
    getLikeButtonClass,
    getDislikeButtonClass
  };
};

export default useFeedback;
