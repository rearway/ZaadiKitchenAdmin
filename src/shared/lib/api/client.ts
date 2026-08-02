import axios from 'axios';
import { env } from '@/shared/config/env';
import { useSessionStore } from '@/store/useSessionStore';
import { ApiError } from '@/shared/types/api';

export const client = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every outgoing request
client.interceptors.request.use((config) => {
  const token = useSessionStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single in-flight refresh promise — prevents parallel refresh races
let refreshPromise: Promise<string> | null = null;

client.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    // Blob-typed requests (PDF/XLSX downloads) get a Blob error body on failure too —
    // decode it back to JSON so the message-extraction logic below still works.
    if (error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // Not JSON (e.g. an actual binary error page) — leave as-is, message extraction falls back below.
      }
    }

    const original = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      const { refreshToken, setAccessToken, clearSession } = useSessionStore.getState();

      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post<{ data?: { accessToken: string }; accessToken?: string }>(
                `${env.apiBaseUrl}/auth/refresh`,
                { refreshToken },
              )
              .then((r) => {
                const token = r.data?.data?.accessToken ?? r.data?.accessToken ?? '';
                setAccessToken(token);
                return token;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }
          const newToken = await refreshPromise;
          original.headers = original.headers ?? {};
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return client(original);
        } catch {
          refreshPromise = null;
          clearSession();
          window.location.replace('/login');
          return Promise.reject(error);
        }
      } else {
        clearSession();
        window.location.replace('/login');
      }
    }

    const message = axios.isAxiosError(error)
      ? (error.response?.data as Record<string, unknown>)?.message?.toString() ?? error.message
      : 'Unknown error';
    const statusCode = axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0;
    console.error(`[API] ${statusCode} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data ?? error.message);
    return Promise.reject(new ApiError(message, statusCode, error.response?.data));
  },
);
