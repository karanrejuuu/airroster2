import { create } from 'zustand';
import { api, post } from '../lib/api';
import type { CrewMember, User, UserRole } from '../types';

type AuthState = {
  user: User | null;
  profile: CrewMember | null;
  loading: boolean;
  setSession: (user: User | null, profile: CrewMember | null) => void;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setSession: (user, profile) => set({ user, profile, loading: false }),
  restore: async () => {
    try {
      const session = await api<{ user: User; profile: CrewMember }>('/api/auth/me');
      set({ user: session.user, profile: session.profile, loading: false });
    } catch {
      set({ user: null, profile: null, loading: false });
    }
  },
  login: async (email, password) => {
    const session = await post<{ user: User; profile: CrewMember }>('/api/auth/login', { email, password });
    set({ user: session.user, profile: session.profile, loading: false });
    return session.user.role;
  },
  logout: async () => {
    await post('/api/auth/logout');
    set({ user: null, profile: null, loading: false });
  }
}));
