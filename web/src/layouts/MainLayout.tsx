import React from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden">
      <Header />
      <main className="flex-grow overflow-auto w-full mx-auto px-2 sm:px-4 md:px-6 max-w-7xl">
        {children}
      </main>
      <footer className="flex-shrink-0 text-center py-3 text-xs text-gray-500 bg-white border-t border-gray-200">
        <p className="mb-1">© {new Date().getFullYear()} Pakistani Law Chatbot - Powered by AI</p>
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