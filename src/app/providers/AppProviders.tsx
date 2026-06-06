import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '@/shared/types/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export default function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
