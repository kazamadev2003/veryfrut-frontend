/**
 * Type definitions for Suppliers (Proveedores)
 */

// ==================== Supplier Types ====================

export interface Supplier {
  id: number;
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

// ==================== Purchase Types ====================

export interface PurchaseItem {
  id?: number;
  productId?: number;
  description?: string;
  quantity: number;
  unitMeasurementId?: number;
  unitCost: number;
  product?: {
    id: number;
    name: string;
  };
  unitMeasurement?: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

export interface Purchase {
  id: number;
  supplierId: number;
  areaId?: number;
  totalAmount: number;
  purchaseDate?: string;
  status: 'created' | 'processing' | 'completed' | 'cancelled';
  paid: boolean;
  paymentDate?: string;
  observation?: string;
  createdAt: string;
  updatedAt: string;
  purchaseItems?: PurchaseItem[];
}

export interface CreatePurchaseInput {
  areaId?: number | null;
  totalAmount: number;
  purchaseDate?: string;
  purchaseItems: PurchaseItem[];
}

export interface UpdatePurchaseInput {
  status?: 'created' | 'processing' | 'completed' | 'cancelled';
  paid?: boolean;
  purchaseDate?: string;
  paymentDate?: Date;
  observation?: string;
}

// ==================== Query Response Types ====================

export interface PaginatedSupplierResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchaseResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Query Parameter Types ====================

export interface GetSuppliersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: 'created' | 'processing' | 'completed' | 'cancelled';
}
