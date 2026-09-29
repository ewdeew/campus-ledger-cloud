import { defineStore } from 'pinia';
import api from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
  },
  actions: {
    setAuth({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
    },
    async register(payload) {
      const { data } = await api.post('/auth/register', payload);
      this.setAuth(data);
    },
    async login(payload) {
      const { data } = await api.post('/auth/login', payload);
      this.setAuth(data);
    },
    async fetchMe() {
      if (!this.token) return;
      try {
        const { data } = await api.get('/auth/me');
        this.user = data.user;
      } catch {
        this.logout();
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      window.location.href = '/login';
    },
  },
});
