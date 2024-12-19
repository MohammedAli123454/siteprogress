import { create } from 'zustand';

// Define the type for the state
interface StoreState {
  isSidebarVisible: boolean;
  toggleSidebar: () => void;
}

// Create the Zustand store with the proper state type
const useStore = create<StoreState>((set) => ({
  isSidebarVisible: false,
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
}));

export default useStore;
