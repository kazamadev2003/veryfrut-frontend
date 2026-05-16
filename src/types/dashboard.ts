/**
 * Tipos para Dashboard - Datos resumidos y analíticas
 */

/**
 * Totales generales del sistema
 */
export interface DashboardTotals {
  products: number;
  orders: number;
  sales: number;
}

/**
 * Datos de órdenes recientes para gráficos
 */
export interface RecentOrder {
  date: string;
  count: number;
  total: number;
}

/**
 * Analíticas del dashboard
 */
export interface DashboardAnalytics {
  recentOrders: RecentOrder[];
}

/**
 * Producto más vendido
 */
export interface TopProduct {
  id: number;
  name: string;
  quantityOrdered: number;
}

/**
 * Usuario con más órdenes
 */
export interface TopUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  orderCount: number;
}

/**
 * Usuario recientemente creado
 */
export interface LatestUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

/**
 * Producto recientemente creado
 */
export interface LatestProduct {
  id: number;
  name: string;
  createdAt: string;
}

/**
 * Respuesta completa del dashboard
 */
export interface DashboardData {
  totals: DashboardTotals;
  analytics: DashboardAnalytics;
  topProducts: TopProduct[];
  topUsers: TopUser[];
  latestUsers: LatestUser[];
  latestProducts: LatestProduct[];
}

/**
 * Parámetros opcionales para obtener datos del dashboard
 */
export interface GetDashboardParams {
  dateRange?: 'today' | 'week' | 'month' | 'year';
  limit?: number;
}
