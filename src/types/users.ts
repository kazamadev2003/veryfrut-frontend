/**
 * Tipos para usuarios - Sincronizados con backend DTOs
 */

export type UserRole = 'admin' | 'customer';

/**
 * Entidad Usuario - Respuesta del servidor
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  areaIds: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para crear usuario (CreateUserDto del backend)
 */
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: UserRole;
  areaIds: number[];
  password: string;
}

/**
 * DTO para actualizar contraseña (UpdatePasswordDto del backend)
 */
export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * DTO para actualizar usuario (parcialmente)
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
  areaIds?: number[];
}

/**
 * Parámetros para listar usuarios
 */
export interface GetUsersParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'firstName' | 'lastName' | 'email' | 'createdAt' | 'updatedAt' | 'role';
  order?: 'asc' | 'desc';
  q?: string; // búsqueda genérica
}

/**
 * Respuesta paginada de usuarios
 */
export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}
