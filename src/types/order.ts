/**
 * Tipos para órdenes - Sincronizados con backend Prisma
 */

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  unitMeasurementId: number;
  createdAt?: string;
  updatedAt?: string;
  product?: {
    id: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: {
      id: number;
      name: string;
    };
  };
  unitMeasurement?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface DeletedOrderItem {
  id: number;
  originalItemId?: number;
  deletedOrderId?: number;
  orderId?: number;
  productId: number;
  quantity: number;
  price?: number;
  unitMeasurementId?: number;
  product?: OrderItem['product'];
  unitMeasurement?: OrderItem['unitMeasurement'];
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
}

export interface Area {
  id: number;
  name: string;
  color: string;
  companyId: number;
  company?: {
    id: number;
    name: string;
  };
}

export interface Order {
  id: number;
  areaId: number;
  userId?: number;
  totalAmount: number;
  status: OrderStatus;
  observation?: string;
  createdAt?: string;
  updatedAt?: string;
  User?: User;
  area?: Area;
  orderItems?: OrderItem[];
}

export interface DeletedOrder {
  id: number;
  originalOrderId: number;
  areaId: number;
  userId?: number;
  totalAmount: number;
  status: OrderStatus;
  observation?: string;
  originalCreatedAt?: string;
  originalUpdatedAt?: string;
  deletedAt: string;
  User?: User;
  area?: Omit<Area, 'color' | 'companyId'> & Partial<Pick<Area, 'color' | 'companyId'>>;
  deletedOrderItems?: DeletedOrderItem[];
}

export type OrderStatus = 'created' | 'process' | 'delivered' | 'pending' | 'confirmed' | 'cancelled';

/**
 * Item de orden para creación
 */
export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  price: number;
  unitMeasurementId: number;
}

/**
 * DTO para crear orden
 */
export interface CreateOrderDto {
  userId: number;
  areaId: number;
  totalAmount: number;
  status: OrderStatus;
  observation?: string;
  orderItems: CreateOrderItemDto[];
}

/**
 * DTO para actualizar orden
 */
export interface UpdateOrderDto {
  areaId?: number;
  userId?: number;
  totalAmount?: number;
  status?: OrderStatus;
  observation?: string;
  orderItems?: CreateOrderItemDto[];
}

/**
 * DTO para verificar orden
 */
export interface CheckOrderDto {
  areaId?: string;
  date?: string;
}

/**
 * Respuesta de verificación de orden
 */
export interface CheckOrderResponse {
  exists: boolean;
  order?: Order;
}

/**
 * Parámetros para listar órdenes
 */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'areaId' | 'userId' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  q?: string;
  status?: string;
  areaId?: number;
  userId?: number;
}

export interface GetDeletedOrdersParams {
  page?: number;
  limit?: number;
  sortBy?:
    | 'id'
    | 'originalOrderId'
    | 'areaId'
    | 'userId'
    | 'totalAmount'
    | 'status'
    | 'originalCreatedAt'
    | 'originalUpdatedAt'
    | 'deletedAt';
  order?: 'asc' | 'desc';
  q?: string;
}

/**
 * Parámetros para filtrar órdenes por fecha
 */
export interface GetOrdersByDateRangeParams {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de órdenes
 */
export interface PaginatedOrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export interface PaginatedDeletedOrdersResponse {
  items: DeletedOrder[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
