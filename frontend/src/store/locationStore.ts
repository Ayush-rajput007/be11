import { create } from 'zustand';

interface LocationState {
  selectedCity: string;
  setCity: (city: string) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  selectedCity: localStorage.getItem('be11_city') || 'Faridabad',
  setCity: (city: string) => {
    localStorage.setItem('be11_city', city);
    set({ selectedCity: city });
  },
}));
