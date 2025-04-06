import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formattedDate } from '../../utils/helpers';

interface Conversation {
  _id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ConversationListProps {
  currentConversationId?: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  currentConversationId,
  onSelect,
  isOpen,
  onToggle
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.chat.conversations.list();
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = () => {
    navigate('/chat');
    onToggle();
  };
  
  const handleSelectConversation = (id: string) => {
    onSelect(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onToggle();
    }
  };
  
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <button 
          onClick={onToggle}
          className="p-1 rounded-full hover:bg-gray-200 md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* New Chat Button */}
      <div className="p-3">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Chat
        </button>
      </div>
      
      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : conversations?.length === 0 ? (
          <div className="text-gray-500 p-4 text-center">No conversations yet</div>
        ) : (
          <ul className="divide-y">
            {conversations?.map((conv) => (
              <li key={conv._id}>
                <button
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`w-full text-left p-3 hover:bg-gray-100 transition-colors ${currentConversationId === conv._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="font-medium truncate">{conv.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{formattedDate(conv.updated_at)}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 