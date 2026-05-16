/**
 * Custom hooks para Product queries y mutations
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import productService, {
  CreateProductDto,
  GetProductsParams,
  UpdateProductDto,
} from '../services/product-service';
import { queryKeys } from '../queryKeys';
import { PaginatedProductsResponse } from '@/types/product';

/**
 * Query: Obtener todos los productos con paginación, ordenamiento y búsqueda
 */
export function useProductsQuery(params?: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log('[useProductsQuery] Fetching con params:', params);
      const response = await productService.getAll(params);
      console.log('[useProductsQuery] Response recibida:', response);
      return response as PaginatedProductsResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Query: Obtener producto por ID
 */
export function useProductQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.products.detail(id as number),
    queryFn: () => productService.getById(id as number),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Query: Obtener productos por categoría
 */
export function useProductsByCategoryQuery(categoryId: number | null, params?: Omit<GetProductsParams, 'categoryId'>) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId as number),
    queryFn: () => productService.getAll({ ...params, categoryId: categoryId as number }),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Mutation: Crear producto
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productService.create(data),
    onSuccess: (newProduct) => {
      if (newProduct) {
        // Invalidar lista de productos
        queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

        // Invalidar productos por categoría
        if (newProduct.categoryId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.products.byCategory(newProduct.categoryId) });
        }

        // Actualizar cache con el nuevo producto
        queryClient.setQueryData(queryKeys.products.detail(newProduct.id), newProduct);
      }
    },
  });
}

/**
 * Mutation: Actualizar producto
 */
export function useUpdateProductMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProductDto) => productService.update(id, data),
    onSuccess: (updatedProduct) => {
      // Actualizar datos específicos del producto
      queryClient.setQueryData(queryKeys.products.detail(id), updatedProduct);

      // Invalidar lista para refrescar si es necesario
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });

      // Invalidar productos por categoría si cambió
      if (updatedProduct?.categoryId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.products.byCategory(updatedProduct.categoryId) });
      }
    },
  });
}

/**
 * Mutation: Eliminar producto
 */
export function useDeleteProductMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => productService.delete(id),
    onSuccess: () => {
      // Remover del cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });

      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}
