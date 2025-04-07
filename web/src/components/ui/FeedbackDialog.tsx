import React, { useState } from 'react';
import Dialog from './Dialog';
import Button from './Button';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Please tell us why',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
}) => {
  const [feedback, setFeedback] = useState('');
  
  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback.trim());
      setFeedback('');
      onClose();
    }
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!feedback.trim()}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-700">Your feedback helps us improve. Please let us know what was wrong with this response:</p>
        <textarea
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please provide your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          autoFocus
        ></textarea>
      </div>
    </Dialog>
  );
};

export default FeedbackDialog;
