/**
 * Service para endpoints de Area
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  GetAreasParams,
  PaginatedAreasResponse,
} from '@/types/area';

// Re-exportar tipos
export type {
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  GetAreasParams,
  PaginatedAreasResponse,
};

class AreaService {
  /**
   * Obtener todas las áreas con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetAreasParams) {
    const response = await axiosInstance.get<Area[] | ApiResponse<Area[]>>('/areas', { params });
    const data = (response.data as ApiResponse<Area[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Obtener área por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Area | ApiResponse<Area>>(`/areas/${id}`);
    const data = (response.data as ApiResponse<Area>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Obtener áreas por ID de empresa
   */
  async getByCompanyId(companyId: number, params?: Omit<GetAreasParams, 'companyId'>) {
    const response = await axiosInstance.get<Area[] | ApiResponse<Area[]>>('/areas', {
      params: { ...params, companyId },
    });
    const data = (response.data as ApiResponse<Area[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Crear nueva área
   */
  async create(data: CreateAreaDto) {
    const response = await axiosInstance.post<Area | ApiResponse<Area>>('/areas', data);
    const responseData = (response.data as ApiResponse<Area>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar área
   */
  async update(id: number, data: UpdateAreaDto) {
    const response = await axiosInstance.patch<Area | ApiResponse<Area>>(`/areas/${id}`, data);
    const responseData = (response.data as ApiResponse<Area>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar área
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/areas/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const areaService = new AreaService();
export default areaService;
