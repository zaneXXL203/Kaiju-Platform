let token = localStorage.getItem('kaiju_token') || '';

export const apiClient = {
  get token() {
    return token;
  },

  setToken(nextToken) {
    token = nextToken || '';
    if (token) localStorage.setItem('kaiju_token', token);
    else localStorage.removeItem('kaiju_token');
  },

  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const body = options.body;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !(body instanceof FormData) && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

    const response = await fetch(path, {
      ...options,
      headers,
      body: body instanceof FormData || typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof data === 'object' ? data.error || 'Request failed' : data || 'Request failed';
      throw new Error(message);
    }
    return data;
  }
};
