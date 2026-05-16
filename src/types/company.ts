/**
 * Tipos para empresas - Sincronizados con backend DTOs
 */

/**
 * Entidad Company - Respuesta del servidor
 */
export interface Company {
  id: number;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear empresa
 */
export interface CreateCompanyDto {
  name: string;
  color: string; // Código hexadecimal válido (ej: #AABBCC)
}

/**
 * DTO para actualizar empresa (parcialmente)
 */
export interface UpdateCompanyDto {
  name?: string;
  color?: string;
}

/**
 * Parámetros para listar empresas
 */
export interface GetCompaniesParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
}

/**
 * Respuesta paginada de empresas
 */
export interface PaginatedCompaniesResponse {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
