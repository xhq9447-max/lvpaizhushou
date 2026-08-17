import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api', timeout: 10000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;
api.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  if (error.response?.status !== 401 || !original || original._retry || original.url?.includes('/auth/refresh')) return Promise.reject(error);
  original._retry = true;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(error);
  refreshing ??= axios.post<{ accessToken: string; refreshToken: string }>(`${api.defaults.baseURL}/auth/refresh`, { refreshToken }).then(({ data }) => {
    localStorage.setItem('accessToken', data.accessToken); localStorage.setItem('refreshToken', data.refreshToken); return data.accessToken;
  }).finally(() => { refreshing = null; });
  try { original.headers.Authorization = `Bearer ${await refreshing}`; return api(original); }
  catch (refreshError) { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); window.location.href = '/login'; return Promise.reject(refreshError); }
});
export default api;

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string | string[] } }>(error)) {
    const message = error.response?.data?.error?.message;
    return Array.isArray(message) ? message.join('；') : message ?? '请求失败，请稍后重试';
  }
  return '请求失败，请稍后重试';
}
