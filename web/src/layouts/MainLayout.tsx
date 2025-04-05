import React from 'react';
import Header from '../components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <main className="flex-grow overflow-hidden flex flex-col p-4 gap-4">
        {children}
      </main>
    </div>
  );
};

export default MainLayout; 