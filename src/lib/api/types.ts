/**
 * Tipos y interfaces generales para la API
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
