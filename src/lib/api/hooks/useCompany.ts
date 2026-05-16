/**
 * Custom hooks para Company queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import companyService, {
  CreateCompanyDto,
  GetCompaniesParams,
  UpdateCompanyDto,
} from '../services/company-service';
import { queryKeys } from '../queryKeys';

/**
 * Query: Obtener todas las empresas con paginación, ordenamiento y búsqueda
 */
export function useCompaniesQuery(params?: GetCompaniesParams) {
  return useQuery({
    queryKey: queryKeys.companies.list(params as Record<string, unknown>),
    queryFn: () => companyService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener empresa por ID
 */
export function useCompanyQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id as number),
    queryFn: () => companyService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Mutation: Crear empresa
 */
export function useCreateCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyDto) => companyService.create(data),
    onSuccess: (newCompany) => {
      if (newCompany) {
        // Invalidar lista de empresas
        queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });

        // Actualizar cache con la nueva empresa
        queryClient.setQueryData(queryKeys.companies.detail(newCompany.id), newCompany);
      }
    },
  });
}

/**
 * Mutation: Actualizar empresa
 */
export function useUpdateCompanyMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanyDto) => companyService.update(id, data),
    onSuccess: (updatedCompany) => {
      // Actualizar datos específicos de la empresa
      queryClient.setQueryData(queryKeys.companies.detail(id), updatedCompany);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
    },
  });
}

/**
 * Mutation: Eliminar empresa
 */
export function useDeleteCompanyMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companyService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.companies.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
    },
  });
}
