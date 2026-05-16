/**
 * Tipos para productos - Sincronizados con backend DTOs
 */

/**
 * Unidad de medida dentro de un producto
 */
export interface ProductUnit {
  id: number;
  productId: number;
  unitMeasurementId: number;
  unitMeasurement: {
    id: number;
    name: string;
    description?: string;
  };
}

/**
 * Entidad Product - Respuesta del servidor
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: number;
  unitMeasurementIds?: number[];
  productUnits?: ProductUnit[]; // Alternativa a unitMeasurementIds con detalles completos
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para crear producto
 */
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: number;
  unitMeasurementIds: number[]; // Array para relación muchos a muchos
}

/**
 * DTO para actualizar producto (parcialmente)
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: number;
  unitMeasurementIds?: number[];
}

/**
 * Parámetros para listar productos
 */
export interface GetProductsParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
  categoryId?: number; // Filtrar por categoría
}

/**
 * Respuesta paginada de productos
 */
export interface PaginatedProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
