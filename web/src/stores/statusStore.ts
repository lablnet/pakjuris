import { create } from 'zustand';

interface StatusUpdate {
  step: string;
  message: string;
  intent?: string;
}

// Simplified State: Only holds the current status
interface StatusState {
  currentStatus: StatusUpdate | null;
  setCurrentStatus: (status: StatusUpdate | null) => void; // Function to update status
}

const useStatusStore = create<StatusState>((set) => ({
  currentStatus: null,
  setCurrentStatus: (status) => set({ currentStatus: status }),
}));

export default useStatusStore;
