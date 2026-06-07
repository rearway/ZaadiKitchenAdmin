// VITE_API_BASE_URL = origin only (e.g. https://devapi.zaadikitchen.com).
// Leave empty in local dev — Vite proxy handles /api/* automatically.
const origin = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export const env = {
  apiBaseUrl: `${origin}/api/v1`,
} as const;
