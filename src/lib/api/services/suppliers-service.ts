/**
 * Service para endpoints de Suppliers (Proveedores)
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';

// Tipos basados en los DTOs del backend
export interface CreatePurchaseItemDto {
  productId?: number;
  description?: string;
  quantity: number;
  unitMeasurementId?: number;
  unitCost: number;
}

export interface CreatePurchaseDto {
  areaId?: number | null;
  totalAmount: number;
  purchaseDate?: string;
  purchaseItems: CreatePurchaseItemDto[];
}

export interface CreateSuplierDto {
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdatePurchaseDto {
  status?: 'created' | 'processing' | 'completed' | 'cancelled';
  paid?: boolean;
  purchaseDate?: string;
  paymentDate?: Date;
  observation?: string;
}

export interface UpdatePurchaseItemDto {
  productId?: number;
  description?: string;
  quantity?: number;
  unitMeasurementId?: number;
  unitCost?: number;
}

export type UpdateSuplierDto = Partial<CreateSuplierDto>;

// Tipos de respuesta
export interface Suplier {
  id: number;
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  purchases?: Purchase[];
}

export interface Purchase {
  id: number;
  suplierId: number;
  areaId?: number;
  totalAmount: number;
  purchaseDate?: string;
  status: 'created' | 'processing' | 'completed' | 'cancelled';
  paid: boolean;
  paymentDate?: string;
  observation?: string;
  createdAt: string;
  updatedAt: string;
  purchaseItems?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId?: number;
  description?: string;
  quantity: number;
  unitMeasurementId?: number;
  unitCost: number;
  product?: {
    id: number;
    name: string;
  };
  unitMeasurement?: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

// Parámetros de consulta
export interface GetSupliersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Tipos de respuesta paginada
export interface PaginatedSupliersResponse {
  data: Suplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchasesResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NormalizedSuppliersPage extends PaginatedSupliersResponse {
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}


class SuppliersService {
  private normalizeSuppliersResponse(
    payload: Suplier[] | ApiResponse<Suplier[]> | PaginatedSupliersResponse
  ): NormalizedSuppliersPage {
    if (payload && typeof payload === 'object' && 'totalPages' in payload && Array.isArray(payload.data)) {
      return payload as NormalizedSuppliersPage;
    }

    const raw = payload as
      | (ApiResponse<Suplier[] | { data?: Suplier[]; meta?: { page?: number; limit?: number; total?: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean } }> & {
          data?: Suplier[] | { data?: Suplier[]; meta?: { page?: number; limit?: number; total?: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean } };
          meta?: { page?: number; limit?: number; total?: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean };
        })
      | { data?: Suplier[]; meta?: { page?: number; limit?: number; total?: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean } };

    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
      const meta = raw.meta || {};
      const items = raw.data;
      const limit = meta.limit ?? items.length;
      const total = meta.total ?? items.length;
      return {
        data: items,
        total,
        page: meta.page ?? 1,
        limit,
        totalPages: meta.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1))),
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      };
    }

    if (raw && typeof raw === 'object' && 'data' in raw && raw.data && typeof raw.data === 'object') {
      const wrapped = raw.data as {
        data?: Suplier[];
        meta?: { page?: number; limit?: number; total?: number; totalPages?: number; hasNextPage?: boolean; hasPrevPage?: boolean };
      };
      if (!Array.isArray(wrapped.data)) {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      }
      const meta = wrapped.meta || {};
      const items = wrapped.data;
      const limit = meta.limit ?? items.length;
      const total = meta.total ?? items.length;
      return {
        data: items,
        total,
        page: meta.page ?? 1,
        limit,
        totalPages: meta.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1))),
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
      };
    }

    const data = (payload as ApiResponse<Suplier[]>)?.data || payload;
    if (Array.isArray(data)) {
      return { data, total: data.length, page: 1, limit: data.length, totalPages: 1 };
    }

    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  /**
   * Obtener todos los proveedores con paginación y ordenamiento
   */
  async getAll(params?: GetSupliersParams) {
    const response = await axiosInstance.get<Suplier[] | ApiResponse<Suplier[]> | PaginatedSupliersResponse>(
      '/supliers',
      { params }
    );
    const firstPage = this.normalizeSuppliersResponse(response.data);

    const isExplicitPagination = typeof params?.page === 'number' || typeof params?.limit === 'number';
    if (isExplicitPagination || firstPage.totalPages <= 1) {
      return firstPage;
    }

    const allSuppliers = [...firstPage.data];
    let currentPage = firstPage.page;
    let hasNextPage = Boolean(firstPage.hasNextPage);

    while (hasNextPage || currentPage < firstPage.totalPages) {
      const nextPage = currentPage + 1;
      const nextResponse = await axiosInstance.get<Suplier[] | ApiResponse<Suplier[]> | PaginatedSupliersResponse>(
        '/supliers',
        { params: { ...params, page: nextPage, limit: firstPage.limit } }
      );
      const parsed = this.normalizeSuppliersResponse(nextResponse.data);
      allSuppliers.push(...parsed.data);
      currentPage = parsed.page || nextPage;
      hasNextPage = Boolean(parsed.hasNextPage);

      if (!hasNextPage && parsed.totalPages <= currentPage) {
        break;
      }
    }

    return {
      data: allSuppliers,
      total: allSuppliers.length,
      page: 1,
      limit: allSuppliers.length,
      totalPages: 1,
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Suplier | ApiResponse<Suplier>>(`/supliers/${id}`);
    const data = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Crear nuevo proveedor
   */
  async create(data: CreateSuplierDto) {
    const response = await axiosInstance.post<Suplier | ApiResponse<Suplier>>('/supliers', data);
    const responseData = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar proveedor
   */
  async update(id: number, data: UpdateSuplierDto) {
    const response = await axiosInstance.patch<Suplier | ApiResponse<Suplier>>(`/supliers/${id}`, data);
    const responseData = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar proveedor
   */
  async delete(id: string | number): Promise<{ success: boolean }> {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/supliers/${id}`);
    const payload = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return { success: Boolean((payload as { success?: boolean }).success) };
    }

    return { success: response.status >= 200 && response.status < 300 };
  }

  /**
   * Obtener todas las compras de un proveedor
   */
  async getPurchasesBySupplier(suplierId: string | number, params?: GetPurchasesParams) {
    const response = await axiosInstance.get<Purchase[] | ApiResponse<Purchase[]> | PaginatedPurchasesResponse>(`/supliers/${suplierId}/purchases`, { params });
    
    // Si es respuesta paginada
    if ('totalPages' in response.data) {
      return response.data as PaginatedPurchasesResponse;
    }
    
    // Si es respuesta simple o ApiResponse
    const data = (response.data as ApiResponse<Purchase[]>)?.data || response.data;
    return Array.isArray(data) ? { data, total: data.length, page: 1, limit: data.length, totalPages: 1 } : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }

  /**
   * Crear compra para un proveedor específico
   */
  async createPurchase(suplierId: string | number, data: CreatePurchaseDto) {
    const response = await axiosInstance.post<Purchase | ApiResponse<Purchase>>(`/supliers/${suplierId}/purchases`, data);
    const responseData = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Obtener compra específica por ID
   */
  async getPurchaseById(purchaseId: string | number) {
    const response = await axiosInstance.get<Purchase | ApiResponse<Purchase>>(`/supliers/purchases/${purchaseId}`);
    const data = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Actualizar compra específica
   */
  async updatePurchase(purchaseId: string | number, data: UpdatePurchaseDto) {
    const response = await axiosInstance.patch<Purchase | ApiResponse<Purchase>>(`/supliers/purchases/${purchaseId}`, data);
    const responseData = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar item de compra por ID
   */
  async updatePurchaseItem(itemId: string | number, data: UpdatePurchaseItemDto) {
    const response = await axiosInstance.patch<PurchaseItem | ApiResponse<PurchaseItem>>(
      `/supliers/purchases/items/${itemId}`,
      data
    );
    const responseData = (response.data as ApiResponse<PurchaseItem>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Crear item de compra para una compra existente
   */
  async createPurchaseItem(purchaseId: string | number, data: CreatePurchaseItemDto) {
    try {
      const response = await axiosInstance.post<PurchaseItem | ApiResponse<PurchaseItem>>(
        `/supliers/purchases/${purchaseId}/items`,
        data
      );
      const responseData = (response.data as ApiResponse<PurchaseItem>)?.data || response.data;
      return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
    } catch {
      const response = await axiosInstance.post<PurchaseItem | ApiResponse<PurchaseItem>>(
        '/supliers/purchases/items',
        { purchaseId, ...data }
      );
      const responseData = (response.data as ApiResponse<PurchaseItem>)?.data || response.data;
      return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
    }
  }

  /**
   * Eliminar item de compra por ID
   */
  async deletePurchaseItem(itemId: string | number): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<
      { success?: boolean; message?: string } | ApiResponse<{ success?: boolean; message?: string }>
    >(`/supliers/purchases/items/${itemId}`);

    const payload = (response.data as ApiResponse<{ success?: boolean; message?: string }>)?.data || response.data;

    if (payload && typeof payload === 'object') {
      if ('success' in payload) {
        return {
          success: Boolean((payload as { success?: boolean }).success),
          message: (payload as { message?: string }).message,
        };
      }

      if ('message' in payload) {
        const message = String((payload as { message?: string }).message ?? '');
        const normalized = message.toLowerCase();
        const successByMessage = normalized.includes('eliminad');
        return { success: successByMessage, message };
      }
    }

    return {
      success: response.status >= 200 && response.status < 300,
    };
  }

  /**
   * Eliminar compra por ID
   */
  async deletePurchase(purchaseId: string | number): Promise<{ success: boolean; message?: string }> {
    const response = await axiosInstance.delete<
      { success?: boolean; message?: string } | ApiResponse<{ success?: boolean; message?: string }>
    >(`/supliers/purchases/${purchaseId}`);

    const payload = (response.data as ApiResponse<{ success?: boolean; message?: string }>)?.data || response.data;

    if (payload && typeof payload === 'object') {
      if ('success' in payload) {
        return {
          success: Boolean((payload as { success?: boolean }).success),
          message: (payload as { message?: string }).message,
        };
      }

      if ('message' in payload) {
        const message = String((payload as { message?: string }).message ?? '');
        const normalized = message.toLowerCase();
        const successByMessage = normalized.includes('eliminad');
        return { success: successByMessage, message };
      }
    }

    return {
      success: response.status >= 200 && response.status < 300,
    };
  }
}

const suppliersService = new SuppliersService();
export default suppliersService;
