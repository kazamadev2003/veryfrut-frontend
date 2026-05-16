/**
 * Service para endpoints de Company
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  GetCompaniesParams,
  PaginatedCompaniesResponse,
} from '@/types/company';

// Re-exportar tipos
export type {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  GetCompaniesParams,
  PaginatedCompaniesResponse,
};

class CompanyService {
  /**
   * Obtener todas las empresas con paginación, ordenamiento y búsqueda
   */
  async getAll(params?: GetCompaniesParams) {
    const response = await axiosInstance.get<Company[] | ApiResponse<Company[]>>('/company', { params });
    const data = (response.data as ApiResponse<Company[]>)?.data || response.data;
    return Array.isArray(data) ? data : [];
  }

  /**
   * Obtener empresa por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Company | ApiResponse<Company>>(`/company/${id}`);
    const data = (response.data as ApiResponse<Company>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Crear nueva empresa
   */
  async create(data: CreateCompanyDto) {
    const response = await axiosInstance.post<Company | ApiResponse<Company>>('/company', data);
    const responseData = (response.data as ApiResponse<Company>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar empresa
   */
  async update(id: number, data: UpdateCompanyDto) {
    const response = await axiosInstance.patch<Company | ApiResponse<Company>>(`/company/${id}`, data);
    const responseData = (response.data as ApiResponse<Company>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /*
   * Eliminar empresa
   */
  async delete(id: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/company/${id}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const companyService = new CompanyService();
export default companyService;
