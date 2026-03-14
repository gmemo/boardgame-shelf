import { create } from 'zustand';

interface NavState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useNavStore = create<NavState>()((set) => ({
  activeTab: '/',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
