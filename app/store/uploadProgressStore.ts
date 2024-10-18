import { create } from "zustand";

interface UploadProgressState {
  progress: number;
  setProgress: (value: number) => void;
}

export const useUploadProgressStore = create<UploadProgressState>((set) => ({
  progress: 0,  // Initial progress is 0
  setProgress: (value: number) => set({ progress: value }),  // Update progress
}));