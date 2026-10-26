import axios from 'axios';

// In production, connect directly to the live Render backend unless overridden with an external URL
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const isProd = import.meta.env.PROD || !import.meta.env.DEV;

let normalizedBaseURL;
if (rawApiUrl.startsWith('http')) {
  normalizedBaseURL = rawApiUrl.endsWith('/api/v1')
    ? rawApiUrl
    : rawApiUrl.endsWith('/api')
    ? `${rawApiUrl}/v1`
    : `${rawApiUrl}/api/v1`;
} else if (isProd) {
  normalizedBaseURL = 'https://e-commerce-website-4-zrlh.onrender.com/api/v1';
} else {
  normalizedBaseURL = '/api/v1';
}

/** Pre-configured axios instance — cookies + JSON, base /api/v1 (proxied in dev). */
const api = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token from localStorage as a cookie fallback (e.g. cross-origin deploys)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages so the UI can always show err.message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong');
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status, data: err.response?.data }));
  }
);

export default api;
