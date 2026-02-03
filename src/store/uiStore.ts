import { create } from 'zustand';

interface UIState {
  activeSection: string;
  isPreviewMode: boolean;
  isExportModalOpen: boolean;
  setActiveSection: (section: string) => void;
  setPreviewMode: (mode: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'personal',
  isPreviewMode: false,
  isExportModalOpen: false,
  setActiveSection: (section) => set({ activeSection: section }),
  setPreviewMode: (mode) => set({ isPreviewMode: mode }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
}));
