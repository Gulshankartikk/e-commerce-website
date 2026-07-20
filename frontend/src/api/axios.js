import axios from 'axios';

/** Pre-configured axios instance — cookies + JSON, base /api/v1 (proxied in dev). */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
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
