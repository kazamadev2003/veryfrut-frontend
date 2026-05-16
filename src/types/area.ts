/**
 * Tipos para áreas - Sincronizados con backend DTOs
 */

/**
 * Entidad Area - Respuesta del servidor
 */
export interface Area {
  id: number;
  name: string;
  color: string;
  companyId: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear área
 */
export interface CreateAreaDto {
  name: string;
  companyId: number;
  color?: string; // Campo opcional para el color
}

/**
 * DTO para actualizar área (parcialmente)
 */
export interface UpdateAreaDto {
  name?: string;
  color?: string;
  companyId?: number;
}

/**
 * Parámetros para listar áreas
 */
export interface GetAreasParams {
  page?: number;
  limit?: number;
  companyId?: number; // Filtrar por empresa
  sortBy?: 'id' | 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
}

/**
 * Respuesta paginada de áreas
 */
export interface PaginatedAreasResponse {
  items: Area[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
