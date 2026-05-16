/**
 * Service para endpoints de Category
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoriesParams,
  PaginatedCategoriesResponse,
} from '@/types/category';

// Re-exportar tipos
export type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  GetCategoriesParams,
  PaginatedCategoriesResponse,
};

class CategoryService {
  /**
   * Obtener todas las categorías con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetCategoriesParams) {
    const response = await axiosInstance.get<Category[] | ApiResponse<Category[]>>('/categories', { params });
    const data = (response.data as ApiResponse<Category[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Obtener categoría por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Category | ApiResponse<Category>>(`/categories/${id}`);
    const data = (response.data as ApiResponse<Category>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Crear nueva categoría
   */
  async create(data: CreateCategoryDto) {
    const response = await axiosInstance.post<Category | ApiResponse<Category>>('/categories', data);
    const responseData = (response.data as ApiResponse<Category>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar categoría
   */
  async update(id: number, data: UpdateCategoryDto) {
    const response = await axiosInstance.patch<Category | ApiResponse<Category>>(`/categories/${id}`, data);
    const responseData = (response.data as ApiResponse<Category>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar categoría
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/categories/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const categoryService = new CategoryService();
export default categoryService;
