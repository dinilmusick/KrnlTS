import { create } from 'zustand';

interface InspectionState {
  apiCount: number;
  incrementApiCount: () => void;
  decrementApiCount: () => void;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  apiCount: 0,
  incrementApiCount: () => set((state) => ({ apiCount: state.apiCount + 1 })),
  decrementApiCount: () => set((state) => ({ apiCount: Math.max(0, state.apiCount - 1) })),
}));
