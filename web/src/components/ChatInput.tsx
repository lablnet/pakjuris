import React from 'react';

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
  );
};

export default ChatInput; 