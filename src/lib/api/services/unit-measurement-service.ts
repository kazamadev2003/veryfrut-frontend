/**
 * Service para endpoints de UnitMeasurement
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  UnitMeasurement,
  CreateUnitMeasurementDto,
  UpdateUnitMeasurementDto,
  GetUnitMeasurementsParams,
  PaginatedUnitMeasurementsResponse,
} from '@/types/unit-measurement';

// Re-exportar tipos
export type {
  UnitMeasurement,
  CreateUnitMeasurementDto,
  UpdateUnitMeasurementDto,
  GetUnitMeasurementsParams,
  PaginatedUnitMeasurementsResponse,
};

class UnitMeasurementService {
  /**
   * Obtener todas las unidades de medida con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetUnitMeasurementsParams) {
    const response = await axiosInstance.get<UnitMeasurement[] | ApiResponse<UnitMeasurement[]>>('/unit-measurements', { params });
    const data = (response.data as ApiResponse<UnitMeasurement[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Obtener unidad de medida por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<UnitMeasurement | ApiResponse<UnitMeasurement>>(`/unit-measurements/${id}`);
    const data = (response.data as ApiResponse<UnitMeasurement>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Crear nueva unidad de medida
   */
  async create(data: CreateUnitMeasurementDto) {
    const response = await axiosInstance.post<UnitMeasurement | ApiResponse<UnitMeasurement>>('/unit-measurements', data);
    const responseData = (response.data as ApiResponse<UnitMeasurement>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar unidad de medida
   */
  async update(id: number, data: UpdateUnitMeasurementDto) {
    const response = await axiosInstance.patch<UnitMeasurement | ApiResponse<UnitMeasurement>>(`/unit-measurements/${id}`, data);
    const responseData = (response.data as ApiResponse<UnitMeasurement>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar unidad de medida
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/unit-measurements/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const unitMeasurementService = new UnitMeasurementService();
export default unitMeasurementService;
