import { useState, useEffect } from 'react';

const useActionMenu = () => {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  const toggleActionMenu = (id: string) => {
    setActionMenuOpen(prev => prev === id ? null : id);
  };
  
  const closeActionMenu = () => {
    setActionMenuOpen(null);
  };
  
  // Handle click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuOpen && !(event.target as Element).closest('.conversation-action-menu')) {
        closeActionMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuOpen]);
  
  return {
    actionMenuOpen,
    toggleActionMenu,
    closeActionMenu
  };
};

export default useActionMenu;
