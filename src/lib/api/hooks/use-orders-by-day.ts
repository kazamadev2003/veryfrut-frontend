'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Order } from '@/types/order';
import orderService from '../services/order-service';
import { ORDERS_QUERY_KEYS } from '../queryKeys';

/**
 * Hook para obtener órdenes por un día específico
 * @param date Fecha en formato YYYY-MM-DD
 * @param enabled Habilitar la query (por defecto true)
 */
export function useOrdersByDay(
  date: string | null,
  enabled: boolean = true
): UseQueryResult<Order[], Error> {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEYS.BY_DAY, date],
    queryFn: async () => {
      if (!date) {
        return [];
      }
      return await orderService.getByDay(date);
    },
    enabled: enabled && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antiguo cacheTime)
  });
}
