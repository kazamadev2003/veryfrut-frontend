/**
 * Service para endpoint del Dashboard
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import { DashboardData, GetDashboardParams } from '@/types/dashboard';

class DashboardService {
  /**
   * Obtener todos los datos del dashboard en una sola llamada
   * GET /dashboard
   * Incluye: totales, analytics, productos top, usuarios top, últimos usuarios y productos
   */
  async getDashboardData(params?: GetDashboardParams): Promise<DashboardData> {
    const response = await axiosInstance.get<DashboardData | ApiResponse<DashboardData>>('/dashboard', { params });
    
    // Manejar dos formatos de respuesta:
    // 1. Respuesta directa: {totals: {...}, analytics: {...}, ...}
    // 2. Respuesta envuelta: {success: true, data: {...}}
    const data = (response.data as ApiResponse<DashboardData>)?.data || response.data;
    
    // Garantizar que siempre retornamos un valor no undefined con la estructura correcta
    return data && typeof data === 'object' && 'totals' in data ? data : {
      totals: { products: 0, orders: 0, sales: 0 },
      analytics: { recentOrders: [] },
      topProducts: [],
      topUsers: [],
      latestUsers: [],
      latestProducts: [],
    };
  }
}

const dashboardService = new DashboardService();
export default dashboardService;

