import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/ui/ToastComp';

interface Conversation {
  _id: string;
  name: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  shareId?: string;
}

// @ts-ignore
const useConversations = (currentConversationId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();
  
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.chat.conversations.list();
      setConversations(response);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchArchivedConversations = async () => {
    try {
      const response = await api.chat.conversations.listArchived();
      setArchivedConversations(response);
    } catch (err) {
      console.error('Failed to fetch archived conversations:', err);
    }
  };
  
  useEffect(() => {
    fetchConversations();
    fetchArchivedConversations();
  }, []);
  
  const handleSelectConversation = (id: string, onSelect: (id: string) => void, onToggle?: () => void) => {
    onSelect(id);
    navigate(`/chat/${id}`);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };
  
  const handleNewChat = (startNewChat: () => void, onToggle?: () => void) => {
    startNewChat();
    // Close the sidebar on mobile after navigation
    if (window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };
  
  const handleArchiveConversation = async (conversation: Conversation) => {
    try {
      await api.chat.conversations.archive(conversation._id, !conversation.archived);
      toast({ 
        type: 'success', 
        message: conversation.archived ? 'Conversation unarchived' : 'Conversation archived' 
      });
      fetchConversations();
      fetchArchivedConversations();
    } catch (err) {
      console.error('Failed to archive conversation:', err);
      toast({ type: 'error', message: 'Failed to archive conversation' });
    }
  };
  
  const handleDeleteConversation = async (conversationId: string, onSuccess?: () => void) => {
    try {
      await api.chat.conversations.delete(conversationId);
      toast({ type: 'success', message: 'Conversation deleted' });
      fetchConversations();
      fetchArchivedConversations();
      
      // If success callback provided (e.g., to navigate away if deleted current conversation)
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast({ type: 'error', message: 'Failed to delete conversation' });
    }
  };
  
  const handleUpdateConversation = async (conversationId: string, data: { name: string }) => {
    try {
      await api.chat.conversations.update(conversationId, data);
      toast({ type: 'success', message: 'Conversation name updated' });
      fetchConversations();
      fetchArchivedConversations();
    } catch (err) {
      console.error('Failed to update conversation name:', err);
      toast({ type: 'error', message: 'Failed to update conversation name' });
    }
  };
  
  const handleShareConversation = async (conversationId: string): Promise<string | null> => {
    try {
      const response = await api.chat.conversations.share(conversationId);
      return response.shareUrl;
    } catch (err) {
      console.error('Failed to share conversation:', err);
      toast({ type: 'error', message: 'Failed to share conversation' });
      return null;
    }
  };
  
  const toggleArchivedView = () => {
    setShowArchived(prev => !prev);
  };
  
  return {
    conversations,
    archivedConversations,
    isLoading,
    error,
    showArchived,
    fetchConversations,
    fetchArchivedConversations,
    handleSelectConversation,
    handleNewChat,
    handleArchiveConversation,
    handleDeleteConversation,
    handleUpdateConversation,
    handleShareConversation,
    toggleArchivedView,
    // Helper to get the active list based on view mode
    displayedConversations: showArchived ? archivedConversations : conversations
  };
};

export default useConversations;
