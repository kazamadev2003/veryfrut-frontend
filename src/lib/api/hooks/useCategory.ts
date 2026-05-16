/**
 * Custom hooks para Category queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import categoryService, {
  CreateCategoryDto,
  GetCategoriesParams,
  UpdateCategoryDto,
} from '../services/category-service';
import { queryKeys } from '../queryKeys';

/**
 * Query: Obtener todas las categorías con paginación, ordenamiento y búsqueda
 */
export function useCategoriesQuery(params?: GetCategoriesParams) {
  return useQuery({
    queryKey: queryKeys.categories.list(params as Record<string, unknown>),
    queryFn: () => categoryService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener categoría por ID
 */
export function useCategoryQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id as number),
    queryFn: () => categoryService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Mutation: Crear categoría
 */
export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
    onSuccess: (newCategory) => {
      if (newCategory) {
        // Invalidar lista de categorías
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });

        // Actualizar cache con la nueva categoría
        queryClient.setQueryData(queryKeys.categories.detail(newCategory.id), newCategory);
      }
    },
  });
}

/**
 * Mutation: Actualizar categoría
 */
export function useUpdateCategoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCategoryDto) => categoryService.update(id, data),
    onSuccess: (updatedCategory) => {
      // Actualizar datos específicos de la categoría
      queryClient.setQueryData(queryKeys.categories.detail(id), updatedCategory);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
  });
}

/**
 * Mutation: Eliminar categoría
 */
export function useDeleteCategoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => categoryService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
  });
}
