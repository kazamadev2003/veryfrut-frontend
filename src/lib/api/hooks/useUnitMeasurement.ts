/**
 * Custom hooks para UnitMeasurement queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import unitMeasurementService, {
  CreateUnitMeasurementDto,
  GetUnitMeasurementsParams,
  UpdateUnitMeasurementDto,
} from '../services/unit-measurement-service';
import { queryKeys } from '../queryKeys';

/**
 * Query: Obtener todas las unidades de medida con paginación, ordenamiento y búsqueda
 */
export function useUnitMeasurementsQuery(params?: GetUnitMeasurementsParams) {
  return useQuery({
    queryKey: queryKeys.unitMeasurements.list(params as Record<string, unknown>),
    queryFn: () => unitMeasurementService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener unidad de medida por ID
 */
export function useUnitMeasurementQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.unitMeasurements.detail(id as number),
    queryFn: () => unitMeasurementService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Mutation: Crear unidad de medida
 */
export function useCreateUnitMeasurementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnitMeasurementDto) => unitMeasurementService.create(data),
    onSuccess: (newUnitMeasurement) => {
      if (newUnitMeasurement) {
        // Invalidar lista de unidades de medida
        queryClient.invalidateQueries({ queryKey: queryKeys.unitMeasurements.lists() });

        // Actualizar cache con la nueva unidad de medida
        queryClient.setQueryData(queryKeys.unitMeasurements.detail(newUnitMeasurement.id), newUnitMeasurement);
      }
    },
  });
}

/**
 * Mutation: Actualizar unidad de medida
 */
export function useUpdateUnitMeasurementMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUnitMeasurementDto) => unitMeasurementService.update(id, data),
    onSuccess: (updatedUnitMeasurement) => {
      // Actualizar datos específicos de la unidad de medida
      queryClient.setQueryData(queryKeys.unitMeasurements.detail(id), updatedUnitMeasurement);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.unitMeasurements.lists() });
    },
  });
}

/**
 * Mutation: Eliminar unidad de medida
 */
export function useDeleteUnitMeasurementMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unitMeasurementService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.unitMeasurements.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.unitMeasurements.lists() });
    },
  });
}
