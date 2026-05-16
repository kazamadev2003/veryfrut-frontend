/**
 * Custom hooks para Suppliers (Proveedores) queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import suppliersService, {
  CreateSuplierDto,
  UpdateSuplierDto,
  CreatePurchaseDto,
  UpdatePurchaseDto,
  GetSupliersParams,
  GetPurchasesParams,
} from '../services/suppliers-service';
import queryKeys from '../queryKeys';

/**
 * Query: Obtener todos los proveedores con paginación y ordenamiento
 */
export function useSuppliersQuery(params?: GetSupliersParams) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(params as Record<string, unknown>),
    queryFn: () => suppliersService.getAll(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: 'always',
  });
}

/**
 * Query: Obtener proveedor por ID
 */
export function useSupplierQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id as number),
    queryFn: () => suppliersService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Query: Obtener compras de un proveedor
 */
export function useSupplierPurchasesQuery(suplierId: number | null, params?: GetPurchasesParams) {
  return useQuery({
    queryKey: queryKeys.suppliers.purchaseList(suplierId as number, params as Record<string, unknown>),
    queryFn: () => suppliersService.getPurchasesBySupplier(suplierId as number, params),
    enabled: !!suplierId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener compra específica por ID
 */
export function usePurchaseQuery(purchaseId: number | null) {
  return useQuery({
    queryKey: queryKeys.suppliers.purchaseDetail(purchaseId as number),
    queryFn: () => suppliersService.getPurchaseById(purchaseId as number),
    enabled: !!purchaseId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Mutation: Crear proveedor
 */
export function useCreateSupplierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSuplierDto) => suppliersService.create(data),
    onSuccess: (newSupplier) => {
      if (newSupplier) {
        // Invalidar lista de proveedores
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });

        // Actualizar cache con el nuevo proveedor
        queryClient.setQueryData(queryKeys.suppliers.detail(newSupplier.id), newSupplier);
      }
    },
  });
}

/**
 * Mutation: Actualizar proveedor
 */
export function useUpdateSupplierMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSuplierDto) => suppliersService.update(id, data),
    onSuccess: (updatedSupplier) => {
      // Actualizar datos específicos del proveedor
      queryClient.setQueryData(queryKeys.suppliers.detail(id), updatedSupplier);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
    },
  });
}

/**
 * Mutation: Eliminar proveedor
 */
export function useDeleteSupplierMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => suppliersService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.suppliers.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
    },
  });
}

/**
 * Mutation: Crear compra para un proveedor
 */
export function useCreatePurchaseMutation(suplierId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseDto) => suppliersService.createPurchase(suplierId, data),
    onSuccess: (newPurchase) => {
      if (newPurchase) {
        // Invalidar lista de compras del proveedor
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(suplierId) });

        // Actualizar cache con la nueva compra
        queryClient.setQueryData(queryKeys.suppliers.purchaseDetail(newPurchase.id), newPurchase);
      }
    },
  });
}

/**
 * Mutation: Actualizar compra
 */
export function useUpdatePurchaseMutation(purchaseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePurchaseDto) => suppliersService.updatePurchase(purchaseId, data),
    onSuccess: (updatedPurchase) => {
      if (updatedPurchase) {
        // Actualizar datos específicos de la compra
        queryClient.setQueryData(queryKeys.suppliers.purchaseDetail(purchaseId), updatedPurchase);

        // Invalidar lista de compras del proveedor correspondiente
        queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(updatedPurchase.suplierId) });
      }
    },
  });
}

/**
 * Mutation: Eliminar compra
 */
export function useDeletePurchaseMutation(purchaseId: number, suplierId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => suppliersService.deletePurchase(purchaseId),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.suppliers.purchaseDetail(purchaseId) });

      // Invalidar lista de compras del proveedor
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(suplierId) });
    },
  });
}
