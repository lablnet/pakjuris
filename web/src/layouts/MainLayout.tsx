import React from 'react';
import Header from '../components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 overflow-hidden">
      <Header />
      <main className="flex-grow overflow-hidden w-full mx-auto px-2 sm:px-4 md:px-6 max-w-7xl">
        {children}
      </main>
      <footer className="flex-shrink-0 text-center py-2 text-xs text-gray-500 bg-white border-t border-gray-200">
        <p>© {new Date().getFullYear()} Pakistani Law Chatbot - A product of <a href="https://fluxhub.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">FluxHub.ai</a></p>
      </footer>
    </div>
  );
};

export default MainLayout; 