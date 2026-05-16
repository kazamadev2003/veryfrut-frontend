/**
 * Custom hooks para Area queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import areaService, {
  CreateAreaDto,
  GetAreasParams,
  UpdateAreaDto,
} from '../services/area-service';
import { queryKeys } from '../queryKeys';

/**
 * Query: Obtener todas las áreas con paginación, ordenamiento y búsqueda
 */
export function useAreasQuery(params?: GetAreasParams) {
  return useQuery({
    queryKey: queryKeys.areas.list(params as Record<string, unknown>),
    queryFn: () => areaService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener áreas por ID de empresa
 */
export function useAreasByCompanyQuery(companyId: number | null, params?: Omit<GetAreasParams, 'companyId'>) {
  return useQuery({
    queryKey: queryKeys.areas.byCompany(companyId as number),
    queryFn: () => areaService.getByCompanyId(companyId as number, params),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener área por ID
 */
export function useAreaQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.areas.detail(id as number),
    queryFn: () => areaService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Mutation: Crear área
 */
export function useCreateAreaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAreaDto) => areaService.create(data),
    onSuccess: (newArea) => {
      if (newArea) {
        // Invalidar lista de áreas
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.lists() });

        // Invalidar áreas de la empresa
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.byCompany(newArea.companyId) });

        // Actualizar cache con la nueva área
        queryClient.setQueryData(queryKeys.areas.detail(newArea.id), newArea);
      }
    },
  });
}

/**
 * Mutation: Actualizar área
 */
export function useUpdateAreaMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAreaDto) => areaService.update(id, data),
    onSuccess: (updatedArea) => {
      // Actualizar datos específicos del área
      queryClient.setQueryData(queryKeys.areas.detail(id), updatedArea);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.areas.lists() });

      // Invalidar áreas de la empresa si cambió
      if (updatedArea?.companyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.byCompany(updatedArea.companyId) });
      }
    },
  });
}

/**
 * Mutation: Eliminar área
 */
export function useDeleteAreaMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => areaService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.areas.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.areas.lists() });
    },
  });
}
