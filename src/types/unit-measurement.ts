/**
 * Tipos para unidades de medida - Sincronizados con backend DTOs
 */

/**
 * Entidad UnitMeasurement - Respuesta del servidor
 */
export interface UnitMeasurement {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear unidad de medida
 */
export interface CreateUnitMeasurementDto {
  name: string; // El nombre de la unidad de medida (Ej: "Kg", "L", "Und")
  description?: string; // Descripción de la unidad de medida (Ej: "Kilogramos", "Litros", etc.)
}

/**
 * DTO para actualizar unidad de medida (parcialmente)
 */
export interface UpdateUnitMeasurementDto {
  name?: string;
  description?: string;
}

/**
 * Parámetros para listar unidades de medida
 */
export interface GetUnitMeasurementsParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'abbreviation' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
}

/**
 * Respuesta paginada de unidades de medida
 */
export interface PaginatedUnitMeasurementsResponse {
  items: UnitMeasurement[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
