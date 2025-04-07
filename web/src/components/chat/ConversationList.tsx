import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formattedDate } from '../../utils/helpers';
import { ConfirmationDialog, EditDialog } from '../ui';
import { useToast } from '../ui/ToastComp';
import Dialog from '../ui/Dialog';
import { useUserStore } from '../../stores/userStore';
import useAuth from '../../hooks/auth/useAuth';

interface Conversation {
  _id: string;
  name: string;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  shareId?: string;
}

interface ConversationListProps {
  currentConversationId?: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  startNewChat: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  currentConversationId,
  onSelect,
  isOpen,
  onToggle,
  startNewChat
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user } = useUserStore();
  const { logout } = useAuth();
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  const toast = useToast();
  
  useEffect(() => {
    fetchConversations();
    fetchArchivedConversations();
  }, []);
  
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
  
  const handleNewChat = () => {
    startNewChat();
    // Close the sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };
  
  const handleSelectConversation = (id: string) => {
    onSelect(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onToggle();
    }
  };
  
  const toggleActionMenu = (id: string) => {
    setActionMenuOpen(prev => prev === id ? null : id);
  };
  
  const handleDeleteClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
    setActionMenuOpen(null);
  };
  
  const handleEditClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setEditDialogOpen(true);
    setActionMenuOpen(null);
  };
  
  const handleArchiveClick = async (conversation: Conversation) => {
    try {
      await api.chat.conversations.archive(conversation._id, !conversation.archived);
      toast({ type: 'success', message: conversation.archived ? 'Conversation unarchived' : 'Conversation archived' });
      fetchConversations();
      fetchArchivedConversations();
    } catch (err) {
      console.error('Failed to archive conversation:', err);
      toast({ type: 'error', message: 'Failed to archive conversation' });
    }
    setActionMenuOpen(null);
  };
  
  const handleShareClick = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation);
      const response = await api.chat.conversations.share(conversation._id);
      setShareUrl(response.shareUrl);
      setShareDialogOpen(true);
    } catch (err) {
      console.error('Failed to share conversation:', err);
      toast({ type: 'error', message: 'Failed to share conversation' });
    }
    setActionMenuOpen(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedConversation) return;
    
    try {
      await api.chat.conversations.delete(selectedConversation._id);
      toast({ type: 'success', message: 'Conversation deleted' });
      fetchConversations();
      fetchArchivedConversations();
      
      // If the deleted conversation was selected, start a new chat
      if (currentConversationId === selectedConversation._id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast({ type: 'error', message: 'Failed to delete conversation' });
    }
  };
  
  const handleEditSave = async (newName: string) => {
    if (!selectedConversation) return;
    
    try {
      await api.chat.conversations.update(selectedConversation._id, { name: newName });
      toast({ type: 'success', message: 'Conversation name updated' });
      fetchConversations();
      fetchArchivedConversations();
    } catch (err) {
      console.error('Failed to update conversation name:', err);
      toast({ type: 'error', message: 'Failed to update conversation name' });
    }
  };
  
  const handleCopyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({ type: 'success', message: 'Share link copied to clipboard' });
    }
  };
  
  const handleToggleArchivedView = () => {
    setShowArchived(prev => !prev);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      toast({ type: 'success', message: 'Logged out successfully' });
    } catch (error) {
      console.error('Failed to log out', error);
      toast({ type: 'error', message: 'Failed to log out' });
    }
  };
  
  // Close any open dialogs when the sidebar is closed
  useEffect(() => {
    if (!isOpen) {
      setActionMenuOpen(null);
    }
  }, [isOpen]);
  
  // Handle click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuOpen && !(event.target as Element).closest('.conversation-action-menu')) {
        setActionMenuOpen(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);
  
  // Display conversations based on whether we're showing archived or regular ones
  const displayedConversations = showArchived ? archivedConversations : conversations;
  
  const renderConversationItem = (conv: Conversation) => (
    <li key={conv._id}>
      <div className="relative group">
        <button
          onClick={() => handleSelectConversation(conv._id)}
          className={`w-full text-left p-3 hover:bg-gray-100 transition-colors flex items-center ${currentConversationId === conv._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
        >
          <div className="flex-grow">
            <div className="font-medium truncate">{conv.name}</div>
            <div className="text-xs text-gray-500 mt-1">{formattedDate(conv.updated_at)}</div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleActionMenu(conv._id);
            }}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Actions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </button>
        
        {actionMenuOpen === conv._id && (
          <div className="absolute right-1 top-12 z-50 bg-white rounded-lg shadow-lg border border-gray-200 w-48 py-1 conversation-action-menu">
            <button
              onClick={() => handleEditClick(conv)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => handleArchiveClick(conv)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              {conv.archived ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Unarchive
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archive
                </>
              )}
            </button>
            <button
              onClick={() => handleShareClick(conv)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => handleDeleteClick(conv)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
  
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-78 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <button 
          onClick={onToggle}
          className="p-1 rounded-full hover:bg-gray-200 md:hidden"
          aria-label="Close sidebar"
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
      
      {/* Archived Toggle */}
      <div className="px-3 py-2 border-b">
        <button 
          onClick={handleToggleArchivedView} 
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <span>{showArchived ? 'Show Active Conversations' : 'Show Archived'}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ml-1 transition-transform ${showArchived ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-24 w-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : displayedConversations?.length === 0 ? (
          <div className="text-gray-500 p-4 text-center">
            {showArchived ? 'No archived conversations' : 'No conversations yet'}
          </div>
        ) : (
          <ul className="divide-y">
            {displayedConversations?.map(renderConversationItem)}
          </ul>
        )}
      </div>
      
      {/* User Profile & Menu - Added to bottom of sidebar */}
      {user && (
        <div className="mt-auto border-t border-gray-200">
          <div className="relative p-4">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold">
                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div className="ml-2 text-left">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || user.email?.split('@')[0]}
                  </p>
                  {user.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {userMenuOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </Link>
                <a
                  href="https://github.com/lablnet/cryonix"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <Link
                  to="/about"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
          {/* Bot disclaimer message in footer */}
          <div className="text-xxs p-2 text-center text-amber-600 bg-amber-50">
            <span className="mr-1">⚠️</span> 
            The Bot can make mistakes. Check with original sources.
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
      />
      
      {/* Edit Dialog */}
      <EditDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditSave}
        title="Rename Conversation"
        label="Conversation Name"
        initialValue={selectedConversation?.name || ''}
        placeholder="Enter a name for this conversation"
      />
      
      {/* Share Dialog */}
      <Dialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        title="Share Conversation"
        actions={
          <button
            onClick={() => setShareDialogOpen(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">Use this link to share the conversation:</p>
          <div className="flex">
            <input
              type="text"
              value={shareUrl || ''}
              readOnly
              className="flex-grow p-2 border rounded-l-lg text-sm bg-gray-50"
            />
            <button
              onClick={handleCopyShareLink}
              className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ConversationList; 