'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTenantId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  tenantId: typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setTenantId: (id) => {
    if (id) localStorage.setItem('tenantId', id);
    else localStorage.removeItem('tenantId');
    set({ tenantId: id });
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    const { accessToken, user } = res.data;
    localStorage.setItem('accessToken', accessToken);
    set({ user });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tenantId');
    set({ user: null, tenantId: null });
  },

  loadProfile: async () => {
    try {
      const res = await authApi.getProfile();
      set({ user: res.data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
