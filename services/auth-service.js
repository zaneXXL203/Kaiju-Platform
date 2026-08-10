import { apiClient } from './api-client.js';

let currentUser = null;

function emitChange() {
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: currentUser }));
}

export const authService = {
  currentUser() {
    return currentUser;
  },

  async restore() {
    if (!apiClient.token) return null;
    try {
      const data = await apiClient.request('/api/auth/me');
      currentUser = data.user;
      return currentUser;
    } catch {
      apiClient.setToken('');
      currentUser = null;
      return null;
    }
  },

  async login(credentials) {
    const data = await apiClient.request('/api/auth/login', {
      method: 'POST',
      body: credentials
    });
    apiClient.setToken(data.token);
    currentUser = data.user;
    emitChange();
    return currentUser;
  },

  async register(payload) {
    const data = await apiClient.request('/api/auth/register', {
      method: 'POST',
      body: payload
    });
    apiClient.setToken(data.token);
    currentUser = data.user;
    emitChange();
    return currentUser;
  },

  logout() {
    apiClient.setToken('');
    currentUser = null;
    emitChange();
  }
};
