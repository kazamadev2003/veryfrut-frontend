/**
 * Cliente HTTP con Axios
 * Wrapper centralizado para todas las requests
 */

import axios, { AxiosInstance } from 'axios';
import apiConfig from './config';
import { clearAuthToken } from './auth';

// Crear instancia de Axios
const axiosInstance: AxiosInstance = axios.create(apiConfig);

// Interceptor para requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Agregar token si existe (ejemplo con localStorage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores globales
    if (error.response?.status === 401) {
      // Token expirado - limpiar y redirigir si es necesario
      clearAuthToken();
      // window.location.href = '/login'; // Descomentar segun necesites
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
