/**
 * Provider de TanStack Query (React Query)
 * Envuelve toda la aplicación para habilitar queries y mutations
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Crear instancia única de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (antes era cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryClientProviderProps {
  children: ReactNode;
}

export function TanStackQueryProvider({ children }: QueryClientProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default TanStackQueryProvider;
