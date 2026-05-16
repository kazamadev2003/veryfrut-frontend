/**
 * Custom hooks para Auth
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import authService from '../services/auth-service';
import { setAuthToken } from '../auth';
import type { LoginDto } from '@/types/auth';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: LoginDto) => authService.login(data),
    onSuccess: (data) => {
      const token =
        typeof data === 'string'
          ? data
          : data?.accessToken || data?.access_token || data?.token;
      if (token) {
        setAuthToken(token);
      }
    },
  });
}
