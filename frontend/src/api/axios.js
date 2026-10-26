import axios from 'axios';

// Normalize API URL: handles bare domains, /api, /api/v1, trailing slashes, or default dev proxy
const defaultApiUrl = import.meta.env.DEV
  ? '/api/v1'
  : 'https://e-commerce-website-4-zrlh.onrender.com/api/v1';

const rawApiUrl = (import.meta.env.VITE_API_URL || defaultApiUrl).trim().replace(/\/+$/, '');
const normalizedBaseURL = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : rawApiUrl.endsWith('/api')
  ? `${rawApiUrl}/v1`
  : rawApiUrl.startsWith('http')
  ? `${rawApiUrl}/api/v1`
  : rawApiUrl;

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
