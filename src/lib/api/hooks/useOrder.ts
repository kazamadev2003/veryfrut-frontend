/**
 * Custom hook para Order queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import orderService, {
  CreateOrderDto,
  UpdateOrderDto,
  CheckOrderDto,
  CheckOrderResponse,
  GetOrdersParams,
  GetOrdersByDateRangeParams,
} from '../services/order-service';
import { queryKeys } from '../queryKeys';
import { Order, PaginatedOrdersResponse, OrderStatus } from '@/types/order';

/**
 * Query: Obtener todas las órdenes con paginación, ordenamiento y búsqueda
 */
export function useOrdersQuery(params?: GetOrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log('[useOrdersQuery] Fetching con params:', params);
      const response = await orderService.getAll(params);
      console.log('[useOrdersQuery] Response recibida:', response);
      return response as PaginatedOrdersResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener orden por ID
 */
export function useOrderQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id as number),
    queryFn: () => orderService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Query: Obtener historial de órdenes por cliente
 */
export function useOrdersByCustomerQuery(
  customerId: number | null,
  params?: Omit<GetOrdersParams, 'userId'>
) {
  return useQuery({
    queryKey: queryKeys.orders.byCustomer(customerId as number),
    queryFn: () => orderService.getByCustomerId(customerId as number, params),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Filtrar órdenes por rango de fechas
 */
export function useOrdersByDateRangeQuery(
  startDate: string | null,
  endDate: string | null,
  params?: Omit<GetOrdersByDateRangeParams, 'startDate' | 'endDate'>
) {
  return useQuery({
    queryKey: queryKeys.orders.byDateRange(startDate as string, endDate as string),
    queryFn: () =>
      orderService.filterByDateRange({
        startDate: startDate as string,
        endDate: endDate as string,
        ...params,
      }),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Verificar existencia de orden
 */
export function useCheckOrderQuery(checkData: CheckOrderDto | null, enabled: boolean = false) {
  return useQuery<CheckOrderResponse>({
    queryKey: ['orders', 'check', checkData],
    queryFn: () => orderService.check(checkData as CheckOrderDto),
    enabled: !!checkData && enabled,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Mutation: Crear orden
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderDto) => orderService.create(data),
    onSuccess: (newOrder) => {
      if (newOrder) {
        // Invalidar lista de órdenes
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

        // Invalidar órdenes por cliente si existe userId
        if (newOrder.userId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders.byCustomer(newOrder.userId) });
        }

        // Actualizar cache con la nueva orden
        queryClient.setQueryData(queryKeys.orders.detail(newOrder.id), newOrder);
      }
    },
  });
}

/**
 * Mutation: Actualizar orden
 */
export function useUpdateOrderMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrderDto) => orderService.update(id, data),
    onSuccess: (updatedOrder) => {
      // Actualizar datos específicos de la orden
      queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Invalidar órdenes por cliente si cambió
      if (updatedOrder?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byCustomer(updatedOrder.userId) });
      }
    },
  });
}

/**
 * Mutation: Eliminar orden
 */
export function useDeleteOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => orderService.delete(id),
    onMutate: (id) => {
      const cachedOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));
      return { userId: cachedOrder?.userId };
    },
    onSuccess: (_deletedOrder, id, context) => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      if (context?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byCustomer(context.userId) });
      }
    },
  });
}

/**
 * Mutation: Actualizar estado de orden
 */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: OrderStatus }) =>
      orderService.update(Number(id), { status }),
    onSuccess: (updatedOrder, variables) => {
      // Actualizar datos específicos de la orden
      queryClient.setQueryData(queryKeys.orders.detail(variables.id), updatedOrder);

      // Invalidar lista para refrescar
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Invalidar órdenes por cliente si cambió
      if (updatedOrder?.userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byCustomer(updatedOrder.userId) });
      }
    },
  });
}
