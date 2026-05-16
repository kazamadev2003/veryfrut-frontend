/**
 * Configuración global de la API
 * Dominio base y valores por defecto para toda la aplicación
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.veryfrut.com/api';
const API_TIMEOUT = 30000; // 30 segundos

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;
