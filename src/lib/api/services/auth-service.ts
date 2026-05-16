/**
 * Service para endpoints de Auth
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';
import type { LoginDto, LoginResponse } from '@/types/auth';

class AuthService {
  /**
   * Autenticar usuario y obtener token
   */
  async login(data: LoginDto): Promise<LoginResponse | undefined> {
    const response = await axiosInstance.post<LoginResponse | ApiResponse<LoginResponse>>('/auth/login', data);
    const raw = response.data;
    if (typeof raw === 'string') {
      return raw as LoginResponse;
    }
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return (raw as ApiResponse<LoginResponse>).data;
    }
    return raw as LoginResponse;
  }
}

const authService = new AuthService();
export default authService;
