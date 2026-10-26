const viteEnv = import.meta.env as { VITE_API_BASE_URL?: string } | undefined;

export const env = {
  apiBaseUrl: viteEnv?.VITE_API_BASE_URL ?? '/api/v1',
} as const;
