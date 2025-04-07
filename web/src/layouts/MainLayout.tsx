import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import { Link, useLocation } from 'react-router-dom';
import ConversationList from '../components/chat/ConversationList';

interface MainLayoutProps {
  children: React.ReactNode;
  conversationId?: string;
  onSelectConversation?: (id: string) => void;
  showConversations?: boolean;
  startNewChat?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  conversationId, 
  onSelectConversation = () => {}, 
  showConversations = true,
  startNewChat = () => {}
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [isChatPage, setIsChatPage] = useState(false);
  
  useEffect(() => {
    // Check if current path is a chat page
    const isChat = location.pathname === '/chat' || location.pathname.startsWith('/chat/');
    setIsChatPage(isChat);
    
    // Close sidebar when navigating away from chat pages
    if (!isChat) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <Header onMenuClick={isChatPage ? toggleSidebar : undefined} />
      
      <div className="flex flex-grow overflow-hidden">
        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && isChatPage && (
          <div 
            className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 md:hidden"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Conversation Sidebar - Only show on chat pages */}
        {showConversations && isChatPage && (
          <ConversationList 
            currentConversationId={conversationId}
            onSelect={onSelectConversation}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            startNewChat={startNewChat}
          />
        )}
        
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto w-full">
          {children}
        </main>
      </div>
      
      <footer className="flex-shrink-0 text-center py-3 text-xs text-gray-500 bg-white border-t border-gray-200">
        <p className="mb-1">© {new Date().getFullYear()} PakJuris - A product of <a href="https://fluxhub.ai" target='_blank' className="underline text-blue-500 hover:text-blue-700">FluxHub.ai</a></p>
        <p className="text-amber-600">
          <span className="mr-1">⚠️</span> 
          The Bot can make mistakes. Check important information with the original source.
          <Link to="/about" className="underline ml-1 text-blue-500 hover:text-blue-700">
            Learn more
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default MainLayout; 