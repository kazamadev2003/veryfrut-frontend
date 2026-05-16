/**
 * Custom hooks para Dashboard queries
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import dashboardService from '../services/dashboard-service';
import queryKeys from '../queryKeys';
import { GetDashboardParams } from '@/types/dashboard';

/**
 * Query: Obtener todos los datos del dashboard
 * Retorna: totales, analytics, top productos, top usuarios, últimos usuarios y productos
 */
export function useDashboardQuery(params?: GetDashboardParams) {
  return useQuery({
    queryKey: queryKeys.dashboard.data(params ? { ...params } : undefined),
    queryFn: () => dashboardService.getDashboardData(params),
    staleTime: 0, // Siempre refetch, los datos pueden cambiar en tiempo real
    gcTime: 1000 * 60 * 10, // Cache por 10 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
