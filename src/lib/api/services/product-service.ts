/**
 * Service para endpoints de Product
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  GetProductsParams,
  PaginatedProductsResponse,
  ProductUnit,
} from '@/types/product';

// Re-exportar tipos
export type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  GetProductsParams,
  PaginatedProductsResponse,
};

/**
 * Normalizar producto: si tiene productUnits, extraer los IDs a unitMeasurementIds
 */
function normalizeProduct(product: Product | (Product & { productUnits?: ProductUnit[] })): Product {
  if (!product) return product;
  
  const normalized: Product = { ...product };
  
  // Si tiene productUnits pero no unitMeasurementIds, extraerlos
  if ('productUnits' in product && product.productUnits && Array.isArray(product.productUnits) && !product.unitMeasurementIds) {
    normalized.unitMeasurementIds = product.productUnits.map((pu: ProductUnit) => pu.unitMeasurementId);
  }
  
  return normalized;
}

class ProductService {
  /**
   * Obtener todos los productos con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetProductsParams) {
    try {
      const response = await axiosInstance.get<PaginatedProductsResponse | ApiResponse<PaginatedProductsResponse>>('/products', { params });
      console.log('[ProductService] Response completo:', response);
      console.log('[ProductService] Response status:', response.status);
      console.log('[ProductService] Response data type:', typeof response.data);
      console.log('[ProductService] Response data keys:', response.data ? Object.keys(response.data) : 'null');
      console.log('[ProductService] Response data:', response.data);
      
      // Extraer la data de la respuesta
      let data: PaginatedProductsResponse | undefined;

      if (Array.isArray(response.data)) {
        const items = response.data as Product[];
        return {
          items: items.map(normalizeProduct),
          total: items.length,
          page: params?.page ?? 1,
          limit: params?.limit ?? items.length,
          hasMore: false,
          totalPages: 1,
        };
      }
      
      // Caso 1: ApiResponse<PaginatedProductsResponse> (envuelto)
      if (response.data && 'data' in response.data && !('items' in response.data)) {
        console.log('[ProductService] Caso 1: ApiResponse envuelto');
        const wrapped = (response.data as unknown as ApiResponse<PaginatedProductsResponse>).data;
        if (Array.isArray(wrapped)) {
          return {
            items: wrapped.map(normalizeProduct),
            total: wrapped.length,
            page: params?.page ?? 1,
            limit: params?.limit ?? wrapped.length,
            hasMore: false,
            totalPages: 1,
          };
        }
        data = wrapped as PaginatedProductsResponse;
      }
      // Caso 2: PaginatedProductsResponse directo (sin envolver)
      else if (response.data && 'items' in response.data) {
        console.log('[ProductService] Caso 2: PaginatedProductsResponse directo');
        data = response.data as unknown as PaginatedProductsResponse;
      }
      // Caso 3: Respuesta envuelta en { data: {...} }
      else if (response.data && typeof response.data === 'object' && response.data !== null) {
        console.log('[ProductService] Caso 3: Objeto sin items ni data, usando response.data');
        data = response.data as unknown as PaginatedProductsResponse;
      }
      
      console.log('[ProductService] Data extraída:', data);
      
      if (!data || !data.items) {
        console.log('[ProductService] No hay items en la data, retornando array vacío');
        return { items: [], total: 0, page: 1, limit: 10, hasMore: false, totalPages: 0 };
      }
      
      // Normalizar cada producto en la lista
      console.log('[ProductService] Items encontrados:', data.items.length);
      const normalizedItems = data.items.map(normalizeProduct);
      console.log('[ProductService] Items después de normalizar:', normalizedItems);
      
      const result = {
        ...data,
        items: normalizedItems,
      };
      
      console.log('[ProductService] Resultado final:', result);
      return result;
    } catch (error) {
      console.error('[ProductService] Error en getAll:', error);
      throw error;
    }
  }

  /**
   * Obtener producto por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Product | ApiResponse<Product>>(`/products/${id}`);
    const data = (response.data as ApiResponse<Product>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? normalizeProduct(data) : undefined;
  }

  /**
   * Crear nuevo producto
   */
  async create(data: CreateProductDto) {
    const response = await axiosInstance.post<Product | ApiResponse<Product>>('/products', data);
    const responseData = (response.data as ApiResponse<Product>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? normalizeProduct(responseData) : undefined;
  }

  /**
   * Actualizar producto
   */
  async update(id: number, data: UpdateProductDto) {
    const response = await axiosInstance.patch<Product | ApiResponse<Product>>(`/products/${id}`, data);
    const responseData = (response.data as ApiResponse<Product>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? normalizeProduct(responseData) : undefined;
  }

  /**
   * Eliminar producto
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/products/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const productService = new ProductService();
export default productService;
