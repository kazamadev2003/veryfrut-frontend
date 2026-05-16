/**
 * Service para endpoints de Order
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  CheckOrderDto,
  CheckOrderResponse,
  GetOrdersParams,
  GetOrdersByDateRangeParams,
  PaginatedOrdersResponse,
} from '@/types/order';

// Re-exportar tipos
export type {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  CheckOrderDto,
  CheckOrderResponse,
  GetOrdersParams,
  GetOrdersByDateRangeParams,
  PaginatedOrdersResponse,
};

class OrderService {
  /**
   * Crear nueva orden
   */
  async create(data: CreateOrderDto) {
    try {
      data.orderItems.forEach((item, index) => {
        console.log(`[OrderService] - Item ${index}:`, {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          unitMeasurementId: item.unitMeasurementId
        });
      });

      console.log('[OrderService] Enviando request a:', `${axiosInstance.defaults.baseURL}/orders`);
      console.log('[OrderService] Headers:', axiosInstance.defaults.headers);
      console.log('[OrderService] Request data (raw):', data);
      console.log('[OrderService] Request data (JSON):', JSON.stringify(data, null, 2));
      
      const response = await axiosInstance.post<Order | ApiResponse<Order>>('/orders', data);
      console.log('[OrderService] Response status:', response.status);
      console.log('[OrderService] Response data:', response.data);
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Create response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? (responseData as Order)
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en create:', error);
      if (error instanceof Error) {
        console.error('[OrderService] Error message:', error.message);
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as Record<string, unknown>;
        console.error('[OrderService] Response status:', (axiosError.response as Record<string, unknown>)?.status);
        console.error('[OrderService] Response data:', (axiosError.response as Record<string, unknown>)?.data);
        console.error('[OrderService] Response headers:', (axiosError.response as Record<string, unknown>)?.headers);
        
        const respData = (axiosError.response as Record<string, unknown>)?.data as Record<string, unknown>;
        if (respData?.message) {
          console.error('[OrderService] Backend error message:', respData.message);
        }
        if (respData?.error) {
          console.error('[OrderService] Backend error details:', respData.error);
        }
      }
      
      throw error;
    }
  }

  /**
   * Obtener todas las órdenes con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetOrdersParams): Promise<PaginatedOrdersResponse> {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse> | Order[]
      >('/orders', { params });
      
      console.log('[OrderService] GetAll response:', response.data);
      
      let data: PaginatedOrdersResponse | undefined;
      
      if (Array.isArray(response.data)) {
        console.log('[OrderService] Caso 0: Array directo de Orders');
        const orders = response.data as Order[];
        return {
          items: orders,
          total: orders.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          hasMore: false,
          totalPages: Math.ceil(orders.length / (params?.limit ?? 10)),
        };
      }
      
      const respData = response.data as unknown as Record<string, unknown>;
      
      if (respData && 'data' in respData && Array.isArray(respData.data)) {
        console.log('[OrderService] Caso 1: ApiResponse con data array');
        const orders = (respData.data as Order[]) ?? [];
        return {
          items: orders,
          total: (respData.total as number) ?? orders.length,
          page: (respData.page as number) ?? (params?.page ?? 1),
          limit: (respData.limit as number) ?? (params?.limit ?? 10),
          hasMore: ((respData.page as number) ?? 1) < ((respData.totalPages as number) ?? 1),
          totalPages: (respData.totalPages as number) ?? Math.ceil(orders.length / ((respData.limit as number) ?? 10)),
        };
      }
      
      if (respData && 'items' in respData) {
        console.log('[OrderService] Caso 2: PaginatedOrdersResponse directo con items');
        data = response.data as unknown as PaginatedOrdersResponse;
      } else if (respData && 'data' in respData && respData.data && 'items' in (respData.data as Record<string, unknown>)) {
        console.log('[OrderService] Caso 3: ApiResponse envuelto con items');
        data = (respData.data as unknown) as PaginatedOrdersResponse;
      } else if (respData && typeof respData === 'object' && respData !== null) {
        console.log('[OrderService] Caso 4: Objeto sin items, usando response.data directamente');
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      
      console.log('[OrderService] Data extraída:', data);
      
      if (!data || !data.items) {
        console.log('[OrderService] No hay items en la data, retornando array vacío');
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      console.log('[OrderService] Items encontrados:', data.items.length);
      return data;
    } catch (error) {
      console.error('[OrderService] Error en getAll:', error);
      throw error;
    }
  }

  /**
   * Verificar existencia de orden
   */
  async check(data: CheckOrderDto): Promise<CheckOrderResponse> {
    try {
      const response = await axiosInstance.get<CheckOrderResponse | ApiResponse<CheckOrderResponse>>('/orders/check', {
        params: data,
      });
      const responseData = response.data as CheckOrderResponse | ApiResponse<CheckOrderResponse> | Record<string, unknown>;
      console.log('[OrderService] Check response:', responseData);
      
      if (responseData && typeof responseData === 'object') {
        if ('exists' in responseData) {
          return responseData as CheckOrderResponse;
        }
        if ('id' in responseData) {
          return { exists: true, order: responseData as unknown as Order };
        }
        if ('data' in responseData && responseData.data) {
          return { exists: true, order: responseData.data as Order };
        }
      }
      
      return { exists: false };
    } catch (error) {
      console.error('[OrderService] Error en check:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as Record<string, unknown>;
        if ((axiosError.response as Record<string, unknown>)?.status === 404) {
          return { exists: false };
        }
      }
      throw error;
    }
  }

  /**
   * Obtener historial de órdenes por cliente
   */
  async getByCustomerId(customerId: number, params?: Omit<GetOrdersParams, 'userId'>) {
    try {
      const response = await axiosInstance.get<
        PaginatedOrdersResponse | ApiResponse<PaginatedOrdersResponse>
      >(`/orders/customer/${customerId}`, { params });
      
      console.log('[OrderService] GetByCustomerId response:', response.data);
      
      let data: PaginatedOrdersResponse | undefined;

      if (Array.isArray(response.data)) {
        const items = response.data as Order[];
        return {
          items,
          total: items.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? items.length,
          hasMore: false,
          totalPages: 1,
        };
      }
      
      if (response.data && 'data' in response.data && !('items' in response.data)) {
        const resp = response.data as unknown as Record<string, unknown>;
        const wrapped = resp.data as unknown;
        if (Array.isArray(wrapped)) {
          const items = wrapped as unknown as Order[];
          return {
            items,
            total: items.length,
            page: params?.page ?? 1,
            limit: params?.limit ?? items.length,
            hasMore: false,
            totalPages: 1,
          };
        }
        data = wrapped as unknown as PaginatedOrdersResponse;
      } else if (response.data && 'items' in response.data) {
        data = response.data as unknown as PaginatedOrdersResponse;
      } else if (response.data && typeof response.data === 'object' && response.data !== null) {
        data = response.data as unknown as PaginatedOrdersResponse;
      }
      
      if (!data || !data.items) {
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      return data;
    } catch (error) {
      console.error('[OrderService] Error en getByCustomerId:', error);
      throw error;
    }
  }

  /**
   * Filtrar órdenes por rango de fechas
   */
  async filterByDateRange(params: GetOrdersByDateRangeParams): Promise<Order[]> {
    try {
      const response = await axiosInstance.get<
        Order[] |
        ApiResponse<Order[]> |
        { items: Order[] } |
        ApiResponse<{ items: Order[] }>
      >('/orders/filter', { params: { startDate: params.startDate, endDate: params.endDate } });
      
      console.log('[OrderService] FilterByDateRange response:', response.data);

      if (Array.isArray(response.data)) {
        return response.data as Order[];
      }

      if (response.data && typeof response.data === 'object') {
        const payload = response.data as Record<string, unknown>;

        if (Array.isArray(payload.data)) {
          return payload.data as Order[];
        }

        if (payload.data && typeof payload.data === 'object') {
          const wrapped = payload.data as Record<string, unknown>;
          if (Array.isArray(wrapped.items)) {
            return wrapped.items as Order[];
          }
        }

        if (Array.isArray(payload.items)) {
          return payload.items as Order[];
        }
      }

      return [];
    } catch (error) {
      console.error('[OrderService] Error en filterByDateRange:', error);
      throw error;
    }
  }

  /**
   * Obtener orden por ID
   */
  async getById(id: string | number) {
    try {
      const response = await axiosInstance.get<Order | ApiResponse<Order>>(`/orders/${id}`);
      const data = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] GetById response:', data);
      return data && typeof data === 'object' && 'id' in data ? (data as Order) : undefined;
    } catch (error) {
      console.error('[OrderService] Error en getById:', error);
      throw error;
    }
  }

  /**
   * Actualizar orden
   */
  async update(id: number, updateData: UpdateOrderDto) {
    try {
      const response = await axiosInstance.patch<Order | ApiResponse<Order>>(`/orders/${id}`, updateData);
      const responseData = (response.data as ApiResponse<Order>)?.data || response.data;
      console.log('[OrderService] Update response:', responseData);
      return responseData && typeof responseData === 'object' && 'id' in responseData
        ? (responseData as Order)
        : undefined;
    } catch (error) {
      console.error('[OrderService] Error en update:', error);
      throw error;
    }
  }

  /**
   * Obtener órdenes por día específico
   * @param date Fecha en formato YYYY-MM-DD
   */
  async getByDay(date: string) {
    try {
      const response = await axiosInstance.get<Order[] | ApiResponse<Order[]>>(
        '/orders/by-day',
        { params: { date } }
      );

      console.log('[OrderService] GetByDay response:', response.data);

      let orders: Order[] = [];

      if (Array.isArray(response.data)) {
        orders = response.data as Order[];
      } else if (response.data && 'data' in response.data && Array.isArray((response.data as unknown as Record<string, unknown>).data)) {
        orders = (response.data as unknown as Record<string, unknown>).data as Order[];
      } else if (response.data && typeof response.data === 'object') {
        orders = (response.data as unknown) as Order[];
      }

      console.log('[OrderService] GetByDay orders found:', orders.length);
      return orders;
    } catch (error) {
      console.error('[OrderService] Error en getByDay:', error);
      throw error;
    }
  }

  /**
   * Eliminar orden
   */
  async delete(id: string | number) {
    try {
      const response = await axiosInstance.delete<
        { success: boolean } | ApiResponse<{ success: boolean }>
      >(`/orders/${id}`);
      const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
      console.log('[OrderService] Delete response:', data);
      return data || { success: false };
    } catch (error) {
      console.error('[OrderService] Error en delete:', error);
      throw error;
    }
  }
}

const orderService = new OrderService();
export default orderService;
