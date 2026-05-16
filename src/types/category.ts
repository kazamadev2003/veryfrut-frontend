/**
 * Tipos para categorías - Sincronizados con backend DTOs
 */

/**
 * Entidad Category - Respuesta del servidor
 */
export interface Category {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear categoría
 */
export interface CreateCategoryDto {
  name: string;
}

/**
 * DTO para actualizar categoría (parcialmente)
 */
export interface UpdateCategoryDto {
  name?: string;
}

/**
 * Parámetros para listar categorías
 */
export interface GetCategoriesParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
}

/**
 * Respuesta paginada de categorías
 */
export interface PaginatedCategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
