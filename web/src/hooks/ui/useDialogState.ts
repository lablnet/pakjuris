import { useState } from 'react';

interface UseDialogStateReturn {
  deleteDialogOpen: boolean;
  editDialogOpen: boolean;
  shareDialogOpen: boolean;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openEditDialog: () => void;
  closeEditDialog: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
}

const useDialogState = (): UseDialogStateReturn => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const openDeleteDialog = () => setDeleteDialogOpen(true);
  const closeDeleteDialog = () => setDeleteDialogOpen(false);
  
  const openEditDialog = () => setEditDialogOpen(true);
  const closeEditDialog = () => setEditDialogOpen(false);
  
  const openShareDialog = () => setShareDialogOpen(true);
  const closeShareDialog = () => setShareDialogOpen(false);
  
  return {
    deleteDialogOpen,
    editDialogOpen,
    shareDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    openEditDialog,
    closeEditDialog,
    openShareDialog,
    closeShareDialog
  };
};

export default useDialogState;
