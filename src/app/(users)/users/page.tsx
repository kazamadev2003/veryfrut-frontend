"use client"

import { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react"
import { ShoppingCart, Search, X, SlidersHorizontal } from "lucide-react"
import axiosInstance from "@/lib/api/client"
import { ProductCardDashboard } from "@/components/users/product-card-dashboard"
import { ShoppingCartDrawer } from "@/components/users/shopping-cart-drawer"
import { useCart } from "@/components/users/use-cart"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import Loading from "@/components/dashboard/sidebar/loading"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Interfaces
interface UnitMeasurement {
  id: number
  name: string
  description: string
}

interface ProductUnit {
  id: number
  productId: number
  unitMeasurementId: number
  unitMeasurement: UnitMeasurement
}

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string
  categoryId: number
  createdAt: string
  updatedAt: string
  productUnits: ProductUnit[]
  rating?: number
}

interface Category {
  id: number
  name: string
  description: string
}

type SortOption = "name" | "price" | "newest" | "rating"

const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["res.cloudinary.com"])
const IMAGE_PLACEHOLDER = "/placeholder.svg"

function getSafeImageSrc(value?: string | null) {
  const src = value?.trim()
  if (!src) return IMAGE_PLACEHOLDER

  if (src.startsWith("/") && !src.startsWith("//")) {
    return src
  }
  if (!src.includes("://") && !src.startsWith("data:")) {
    return `/${src.replace(/^\.?\/+/, "")}`
  }

  try {
    const parsed = new URL(src)
    if (!["http:", "https:"].includes(parsed.protocol)) return IMAGE_PLACEHOLDER
    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname)) return IMAGE_PLACEHOLDER
    return src
  } catch {
    return IMAGE_PLACEHOLDER
  }
}

// Skeleton del producto
const ProductSkeleton = () => (
  <div className="flex flex-col animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
    <div className="w-full aspect-video bg-gray-200" />
    <div className="p-4 flex-1 flex flex-col">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="space-y-2">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
)

// Hook para detección de móvil
const useIsMobile = () => {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!mounted) return
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)
    checkIfMobile()
    const handleResize = () => checkIfMobile()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mounted])

  return { isMobile: mounted ? isMobile : false, mounted }
}

// Hoja de filtros móviles
const MobileFiltersSheet = ({
  isOpen,
  onOpenChange,
  categories,
  activeFilter,
  onFilterChange,
  sortBy: sortByProp,
  onSortChange,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  activeFilter: number | null
  onFilterChange: (categoryId: number | null) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}) => {
  const sortBy: SortOption = sortByProp
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => onOpenChange(false)}>
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6 pb-12">
          {/* Categorías */}
          <div>
            <h3 className="font-bold text-base mb-4 text-gray-900 flex items-center">
              <SlidersHorizontal className="h-5 w-5 mr-2 text-green-600" />
              Categorías
            </h3>
            <div className="space-y-2">
              <Button
                variant={activeFilter === null ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-10 font-medium",
                  activeFilter === null ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50",
                )}
                onClick={() => {
                  onFilterChange(null)
                  onOpenChange(false)
                }}
              >
                Todos los productos
                {activeFilter === null && <Badge variant="secondary" className="ml-auto">Activo</Badge>}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeFilter === cat.id ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start h-10 font-medium",
                    activeFilter === cat.id ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50",
                  )}
                  onClick={() => {
                    onFilterChange(cat.id)
                    onOpenChange(false)
                  }}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Ordenamiento */}
          <div>
            <h3 className="font-bold text-base mb-4 text-gray-900">Ordenar por</h3>
            <div className="space-y-2">
              {[
                { value: "name" as SortOption, label: "Nombre (A-Z)" },
                { value: "price" as SortOption, label: "Precio (menor a mayor)" },
                { value: "newest" as SortOption, label: "Más recientes" },
                { value: "rating" as SortOption, label: "Mejor valorados" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={sortBy === opt.value ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start h-10 font-medium",
                    sortBy === opt.value ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50",
                  )}
                  onClick={() => {
                    onSortChange(opt.value)
                    onOpenChange(false)
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  // Estado
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [activeFilter, setActiveFilter] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [isLoading, setIsLoading] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const { isMobile, mounted } = useIsMobile()
  const { cart, addToCartAsDuplicate, getTotalItems, getTotalPrice, ...cartMethods } = useCart()

  const handleAddItemFromDrawer = useCallback(
    (product: Product, selectedUnitId: number, quantity: number) => {
      addToCartAsDuplicate(
        {
          ...product,
          quantity,
          selectedUnitId,
        },
        selectedUnitId,
      )
    },
    [addToCartAsDuplicate],
  )

  const handleChangeCartItemUnit = useCallback(
    (item: (typeof cart)[number], nextUnitId: number) => {
      if (item.selectedUnitId === nextUnitId) return
      cartMethods.removeFromCart(item.id, item.selectedUnitId, item.cartItemId)
      addToCartAsDuplicate(
        {
          ...item,
          selectedUnitId: nextUnitId,
        },
        nextUnitId,
      )
    },
    [addToCartAsDuplicate, cartMethods],
  )
  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [productsRes, categoriesRes] = await Promise.all([
        axiosInstance.get("/products"),
        axiosInstance.get("/categories"),
      ])

      const fetchedProducts: Product[] = Array.isArray(productsRes.data) ? productsRes.data : []
      const normalizedProducts = fetchedProducts.map((product) => ({
        ...product,
        imageUrl: getSafeImageSrc(product.imageUrl),
      }))
      const fetchedCategories: Category[] = Array.isArray(categoriesRes.data) ? categoriesRes.data : []

      setProducts(normalizedProducts)
      setFilteredProducts(normalizedProducts)
      setCategories(fetchedCategories)
    } catch (error) {
      console.error("[v0] Error cargando productos:", error)
      toast.error("Error al cargar productos")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Ordenar productos
  const sortProducts = useCallback((prods: Product[], option: SortOption) => {
    const sorted = [...prods]
    switch (option) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case "price":
        return sorted.sort((a, b) => a.price - b.price)
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "rating":
        return sorted.sort((a, b) => (b.rating || 5) - (a.rating || 5))
      default:
        return sorted
    }
  }, [])

  // Aplicar filtros
  const applyFiltersAndSort = useCallback(
    (catId: number | null, query: string, sort: SortOption) => {
      let filtered = [...products]

      if (catId !== null) {
        filtered = filtered.filter((p) => p.categoryId === catId)
      }

      if (query.trim()) {
        const searchTerms = query.toLowerCase().split(" ")
        filtered = filtered.filter((p) => {
          const text = `${p.name} ${p.description}`.toLowerCase()
          return searchTerms.every((term) => text.includes(term))
        })
      }

      filtered = sortProducts(filtered, sort)
      setFilteredProducts(filtered)
    },
    [products, sortProducts],
  )

  // Manejadores
  const handleFilterChange = useCallback(
    (catId: number | null) => {
      setActiveFilter(catId)
      applyFiltersAndSort(catId, searchQuery, sortBy)
    },
    [applyFiltersAndSort, searchQuery, sortBy],
  )

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      applyFiltersAndSort(activeFilter, query, sortBy)
    },
    [applyFiltersAndSort, activeFilter, sortBy],
  )

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setSortBy(sort)
      applyFiltersAndSort(activeFilter, searchQuery, sort)
    },
    [applyFiltersAndSort, activeFilter, searchQuery],
  )

  // Estadísticas
  const stats = useMemo(
    () => ({
      total: products.length,
      filtered: filteredProducts.length,
      cartItems: getTotalItems(),
    }),
    [products.length, filteredProducts.length, getTotalItems],
  )

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
          <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Catalogo</p>
                <h1 className="text-2xl font-bold text-gray-900">Catalogo de productos</h1>
                <p className="text-sm text-gray-500">Explora y agrega productos al carrito.</p>
              </div>
            </div>
          </div>
        </header>
      </div>
    )
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Catalogo</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catalogo de productos</h1>
                <p className="text-sm text-gray-500">Explora y agrega productos al carrito.</p>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {stats.filtered} productos
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isMobile && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="h-10 w-10"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="h-10 w-10 relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {stats.cartItems > 0 && (
                  <Badge className="absolute -right-2 -top-2 h-5 w-5 p-0 flex items-center justify-center bg-green-600">
                    {stats.cartItems > 99 ? "99+" : stats.cartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {/* Filtros de escritorio */}
          {!isMobile && (
            <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <div className="flex items-center gap-6">
                {/* Búsqueda */}
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Buscar por nombre..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 h-11 border-gray-300"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => handleSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ordenar */}
                <div className="w-48">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Ordenar</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="name">Nombre (A-Z)</option>
                    <option value="price">Precio (menor)</option>
                    <option value="newest">Más recientes</option>
                    <option value="rating">Mejor valorados</option>
                  </select>
                </div>
              </div>

              {/* Categorías */}
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-semibold text-gray-700 mb-3 block">Categorías</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activeFilter === null ? "default" : "outline"}
                    className={cn(
                      "h-10",
                      activeFilter === null ? "bg-green-600 hover:bg-green-700 text-white" : "",
                    )}
                    onClick={() => handleFilterChange(null)}
                  >
                    Todos
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={activeFilter === cat.id ? "default" : "outline"}
                      className={cn(
                        "h-10",
                        activeFilter === cat.id ? "bg-green-600 hover:bg-green-700 text-white" : "",
                      )}
                      onClick={() => handleFilterChange(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grid de productos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCardDashboard
                    key={product.id}
                    product={product}
                    onAddToCart={(cartProduct) => addToCartAsDuplicate(cartProduct, cartProduct.selectedUnitId)}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900">No hay productos</h3>
                  <p className="text-gray-600 mt-1">Intenta con otros filtros</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Hoja de filtros móviles */}
      <MobileFiltersSheet
        isOpen={isMobileFilterOpen}
        onOpenChange={setIsMobileFilterOpen}
        categories={categories}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      {/* Drawer del carrito */}
      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        availableProducts={products}
        onAddItem={handleAddItemFromDrawer}
        onChangeItemUnit={handleChangeCartItemUnit}
        onUpdateQuantity={cartMethods.updateCartItemQuantity}
        onRemoveItem={cartMethods.removeFromCart}
        onClearCart={cartMethods.clearCart}
        totalPrice={getTotalPrice()}
      />
    </Suspense>
  )
}
