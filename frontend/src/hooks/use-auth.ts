'use client';

import { create } from 'zustand';
import { authApi, tenantApi } from '@/lib/api';

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

    // 로그인 후 테넌트 자동 선택
    try {
      const tenantRes = await tenantApi.list();
      const tenants = tenantRes.data;
      if (tenants.length > 0) {
        const tid = tenants[0].id;
        localStorage.setItem('tenantId', tid);
        set({ tenantId: tid });
      }
    } catch {
      // 테넌트 로드 실패 시 무시
    }
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

      // tenantId가 없으면 자동 로드
      const currentTenantId = localStorage.getItem('tenantId');
      if (!currentTenantId) {
        try {
          const tenantRes = await tenantApi.list();
          const tenants = tenantRes.data;
          if (tenants.length > 0) {
            localStorage.setItem('tenantId', tenants[0].id);
            set({ tenantId: tenants[0].id });
          }
        } catch {
          // 테넌트 로드 실패 시 무시
        }
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
