import { create } from 'zustand';
import { UserDTO } from '@be11/shared';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserDTO, token: string) => void;
  logout: () => void;
  updateWalletBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('be11_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('be11_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  updateWalletBalance: (balance) => {
    set((state) => ({
      user: state.user ? { ...state.user, walletBalance: balance } : null,
    }));
  },
}));
