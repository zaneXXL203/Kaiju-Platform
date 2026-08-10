import { apiClient } from './api-client.js';

export const modelService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params);
    return apiClient.request(`/api/models?${qs}`);
  },

  async search(params = {}) {
    const qs = new URLSearchParams(params);
    return apiClient.request(`/api/search?${qs}`);
  },

  async get(id) {
    return apiClient.request(`/api/models/${encodeURIComponent(id)}`);
  },

  async upload(formData) {
    return apiClient.request('/api/models', {
      method: 'POST',
      body: formData
    });
  },

  async like(id) {
    return apiClient.request(`/api/models/${encodeURIComponent(id)}/like`, {
      method: 'POST'
    });
  },

  downloadUrl(id, format = '') {
    const qs = format ? `?format=${encodeURIComponent(format)}` : '';
    return `/api/models/${encodeURIComponent(id)}/download${qs}`;
  }
};
