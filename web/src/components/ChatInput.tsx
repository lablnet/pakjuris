import React from 'react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  question: string;
  setQuestion: (question: string) => void;
  handleAsk: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  question,
  setQuestion,
  handleAsk,
  isLoading
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
    >
      <div className="flex gap-3">
        <div className="flex-grow relative">
          <input
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about Pakistani laws..."
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            disabled={isLoading}
          />
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </motion.div>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            px-6 py-3 rounded-xl font-medium text-white shadow-lg
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          `}
          onClick={handleAsk}
          disabled={!question.trim() || isLoading}
        >
          {isLoading ? 'Processing...' : 'Ask'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatInput; 