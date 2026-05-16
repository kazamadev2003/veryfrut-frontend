/**
 * Custom hooks para Upload mutations
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import uploadService from '../services/upload-service';

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!(file instanceof File)) {
        throw new Error('Selecciona un archivo válido antes de subirlo');
      }

      return uploadService.upload(file);
    },
  });
}

export function useDeleteUploadMutation() {
  return useMutation({
    mutationFn: (publicId: string) => uploadService.delete(publicId),
  });
}
