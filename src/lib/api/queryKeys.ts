/**
 * Factory para generar query keys consistentes
 * Sigue la estructura: [resource, action, ...identifiers]
 */

export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), { ...filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.users.details(), id] as const,
    byEmail: (email: string) => [...queryKeys.users.all, 'byEmail', email] as const,
  },

  // Posts
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.posts.lists(), { ...filters }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.posts.details(), id] as const,
    byAuthor: (authorId: string | number) =>
      [...queryKeys.posts.all, 'byAuthor', authorId] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    lists: () => [...queryKeys.comments.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.comments.lists(), { ...filters }] as const,
    details: () => [...queryKeys.comments.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.comments.details(), id] as const,
    byPost: (postId: string | number) =>
      [...queryKeys.comments.all, 'byPost', postId] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    data: (params?: { dateRange?: string; limit?: number }) =>
      params ? [...queryKeys.dashboard.all, 'data', params] : [...queryKeys.dashboard.all, 'data'] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.companies.lists(), { ...filters }] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.companies.details(), id] as const,
  },

  // Areas
  areas: {
    all: ['areas'] as const,
    lists: () => [...queryKeys.areas.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.areas.lists(), { ...filters }] as const,
    details: () => [...queryKeys.areas.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.areas.details(), id] as const,
    byCompany: (companyId: string | number) =>
      [...queryKeys.areas.all, 'byCompany', companyId] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.categories.lists(), { ...filters }] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.categories.details(), id] as const,
  },

  // Unit Measurements
  unitMeasurements: {
    all: ['unitMeasurements'] as const,
    lists: () => [...queryKeys.unitMeasurements.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.unitMeasurements.lists(), { ...filters }] as const,
    details: () => [...queryKeys.unitMeasurements.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.unitMeasurements.details(), id] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.lists(), { ...filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.products.details(), id] as const,
    byCategory: (categoryId: string | number) =>
      [...queryKeys.products.all, 'byCategory', categoryId] as const,
  },

// Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), { ...filters }] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.orders.details(), id] as const,
    byCustomer: (customerId: string | number) =>
      [...queryKeys.orders.all, 'byCustomer', customerId] as const,
    byDateRange: (startDate: string, endDate: string) =>
      [...queryKeys.orders.all, 'byDateRange', startDate, endDate] as const,
  },

  // Suppliers (Proveedores)
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...queryKeys.suppliers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.suppliers.lists(), { ...filters }] as const,
    details: () => [...queryKeys.suppliers.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.suppliers.details(), id] as const,
    purchases: (suplierId: string | number) =>
      [...queryKeys.suppliers.all, 'purchases', suplierId] as const,
    purchaseLists: (suplierId: string | number) =>
      [...queryKeys.suppliers.purchases(suplierId), 'list'] as const,
    purchaseList: (suplierId: string | number, filters?: Record<string, unknown>) =>
      [...queryKeys.suppliers.purchaseLists(suplierId), { ...filters }] as const,
    purchaseDetail: (purchaseId: string | number) =>
      [...queryKeys.suppliers.all, 'purchases', 'detail', purchaseId] as const,
  },
};

export default queryKeys;

export const ORDERS_QUERY_KEYS = {
  BY_DAY: 'byDay',
  ALL: 'orders',
  LIST: 'list',
  DETAIL: 'detail',
  BY_CUSTOMER: 'byCustomer',
  BY_DATE_RANGE: 'byDateRange',
};
