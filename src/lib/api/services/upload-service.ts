/**
 * Service para endpoints de uploads
 */

import { AxiosError } from 'axios';
import axiosInstance from '../client';
import { ApiResponse } from '../types';

export interface UploadAsset {
  url: string;
  publicId: string;
}

export interface DeleteUploadResponse {
  success: boolean;
  message?: string;
}

type UploadResponseShape = UploadAsset | Record<string, unknown>;

function extractData<T>(response: T | ApiResponse<T>) {
  if (
    response &&
    typeof response === 'object' &&
    'data' in (response as Record<string, unknown>) &&
    (response as ApiResponse<T>).data
  ) {
    return (response as ApiResponse<T>).data as T;
  }

  return response as T;
}

function normalizeUploadAsset(payload: UploadResponseShape | undefined): UploadAsset {
  const source = payload as Record<string, unknown> | undefined;
  const url =
    (typeof source?.url === 'string' && source.url) ||
    (typeof source?.imageUrl === 'string' && source.imageUrl) ||
    (typeof source?.secure_url === 'string' && source.secure_url) ||
    '';
  const publicId =
    (typeof source?.publicId === 'string' && source.publicId) ||
    (typeof source?.public_id === 'string' && source.public_id) ||
    '';

  if (!url || !publicId) {
    throw new Error('La respuesta del upload no incluye url o publicId');
  }

  return {
    url,
    publicId,
  };
}

function extractUploadErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(responseData?.message)) {
      return responseData.message.join(', ');
    }

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }

    if (typeof responseData?.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Error al subir el archivo';
}

class UploadService {
  /**
   * Subir imagen
   */
  async upload(file: File) {
    if (!(file instanceof File)) {
      throw new Error('No se recibió un archivo válido para subir');
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const response = await axiosInstance.post<UploadResponseShape | ApiResponse<UploadResponseShape>>('/uploads', formData, {
        transformRequest: [
          (data, headers) => {
            if (headers && typeof headers.delete === 'function') {
              headers.delete('Content-Type');
            } else if (headers && typeof headers === 'object') {
              delete headers['Content-Type'];
              delete headers['content-type'];
            }

            return data;
          },
        ],
      });

      return normalizeUploadAsset(extractData(response.data));
    } catch (error) {
      throw new Error(extractUploadErrorMessage(error));
    }
  }

  /**
   * Eliminar imagen por publicId
   */
  async delete(publicId: string) {
    const response = await axiosInstance.delete<DeleteUploadResponse | ApiResponse<DeleteUploadResponse>>(
      `/uploads/${encodeURIComponent(publicId)}`
    );

    const data = extractData(response.data);
    return data || { success: false };
  }
}

const uploadService = new UploadService();

export default uploadService;
