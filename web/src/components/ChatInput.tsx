import React from 'react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  question: string;
  setQuestion: (question: string) => void;
  handleAsk: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  question,
  setQuestion,
  handleAsk,
  isLoading,
  disabled = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading && !disabled) {
      handleAsk();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !isLoading && !disabled) {
        handleAsk();
      }
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className={`
        flex items-center gap-2 
        bg-white p-2 rounded-xl shadow-md border border-gray-200
        transition-all duration-300
        ${disabled ? 'opacity-70' : ''}
      `}
    >
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Reconnect to continue..." : "Ask a question about Pakistani law..."}
        className="flex-grow p-2 border-none focus:ring-0 focus:outline-none resize-none max-h-32 rounded-lg"
        rows={1}
        disabled={isLoading || disabled}
      />
      <button
        type="submit"
        disabled={!question.trim() || isLoading || disabled}
        className={`
          p-3 rounded-lg
          ${!question.trim() || isLoading || disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg'}
          transition-all duration-300
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center w-6 h-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-white rounded-full border-t-transparent"
            />
          </span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        )}
      </button>
    </motion.form>
  );
};

export default ChatInput; 