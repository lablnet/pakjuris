import React from 'react';
import Header from '../components/layout/Header';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-100">
      <Header />
      <main className="flex-grow overflow-y-auto w-full">
        {children}
      </main>
      <footer className="flex-shrink-0 text-center py-3 text-xs text-gray-500 bg-white border-t border-gray-200">
        <p className="mb-1">© {new Date().getFullYear()} PakJuris - Powered by AI</p>
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