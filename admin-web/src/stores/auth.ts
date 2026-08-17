import { defineStore } from 'pinia';
import api from '@/api/http';
import type { Profile } from '@/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({ profile: null as Profile | null, loading: false }),
  getters: { isLoggedIn: () => Boolean(localStorage.getItem('accessToken')), isSuperAdmin: (state) => state.profile?.role === 'SUPER_ADMIN' },
  actions: {
    async login(username: string, password: string) {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { username, password });
      localStorage.setItem('accessToken', data.accessToken); localStorage.setItem('refreshToken', data.refreshToken); await this.loadProfile();
    },
    async loadProfile() { this.loading = true; try { this.profile = (await api.get<Profile>('/auth/profile')).data; } finally { this.loading = false; } },
    async logout() {
      const refreshToken = localStorage.getItem('refreshToken');
      try { if (refreshToken) await api.post('/auth/logout', { refreshToken }); } finally { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); this.profile = null; }
    },
  },
});
