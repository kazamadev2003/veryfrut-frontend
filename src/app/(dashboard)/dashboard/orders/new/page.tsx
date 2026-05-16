"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Package, Plus, Trash2, Send, Users } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useProductsQuery } from "@/lib/api/hooks/useProduct"
import { useCreateOrderMutation, useCheckOrderQuery } from "@/lib/api/hooks/useOrder"
import { useUsersQuery } from "@/lib/api/hooks/useUsers"
import { useAreasQuery } from "@/lib/api/hooks/useArea"
import orderService from "@/lib/api/services/order-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Suspense } from "react"
import Loading from "@/components/dashboard/sidebar/loading"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Product, ProductUnit } from "@/types/product"
import type { User } from "@/types/users"
import { CreateOrderDto, CreateOrderItemDto, CheckOrderResponse } from "@/types/order"

interface TableProduct {
  id: string
  product: Product
  quantity: number // Supports decimal values
  selectedUnitId: number
  selectedUnit: ProductUnit['unitMeasurement']
  isEditing: boolean
}

const AdminFastOrdersPage = () => {
  const router = useRouter()
  const [tableProducts, setTableProducts] = useState<TableProduct[]>([])
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})
  const [productSearch, setProductSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [areas, setAreas] = useState<Array<{id: number; name: string}>>([])
  const [blockedAreaIds, setBlockedAreaIds] = useState<Set<number>>(new Set())
  const [isPrecheckingAreas, setIsPrecheckingAreas] = useState(false)
  const [orderObservations, setOrderObservations] = useState<string>("")
  const [existingOrder, setExistingOrder] = useState<{id: number; status: string; areaId: number; totalAmount: number} | undefined>(undefined)
  
  // Track orders created in this session to prevent duplicates
  const [sessionOrderKeys, setSessionOrderKeys] = useState<Set<string>>(new Set())
  const createOrderMutation = useCreateOrderMutation()
  
  // Prevent hydration mismatches by only rendering after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get all users, products, and areas for admin
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({ page: 1, limit: 200 })
  const { data: productsData, isLoading, error } = useProductsQuery({ page: 1, limit: 100 })
  const { data: allAreas = [] } = useAreasQuery()
  
  const users = useMemo(
    () => (Array.isArray(usersData) ? usersData : usersData?.items ?? []),
    [usersData]
  )
  const products = useMemo(() => productsData?.items || [], [productsData?.items])
  
  // Get today's date in Peru local time to avoid UTC day rollover
  const todayDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return formatter.format(new Date())
  }, [])

  // Get selected user details
  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId)
  }, [users, selectedUserId])

  // Load areas when user changes
  useEffect(() => {
    console.log("[AdminFastOrdersPage] selectedUserId:", selectedUserId)
    console.log("[AdminFastOrdersPage] selectedUser:", selectedUser)

    let nextAreas: Array<{ id: number; name: string }> = []

    if (selectedUser) {
      const embeddedAreas = (selectedUser as User & { areas?: Array<{ id: number; name: string }> })?.areas || []
      const userAreaIds = selectedUser.areaIds || []

      console.log("[AdminFastOrdersPage] userAreas (embedded):", embeddedAreas)
      console.log("[AdminFastOrdersPage] userAreaIds:", userAreaIds)

      if (embeddedAreas.length > 0) {
        nextAreas = embeddedAreas
      } else if (userAreaIds.length > 0) {
        nextAreas = allAreas.filter((area) => userAreaIds.includes(area.id))
      }
    }

    setAreas((prev) => {
      const sameLength = prev.length === nextAreas.length
      const sameValues = sameLength && prev.every((item, index) => item.id === nextAreas[index]?.id && item.name === nextAreas[index]?.name)
      return sameValues ? prev : nextAreas
    })
    if (!nextAreas.length) {
      setSelectedAreaId(undefined)
    }
  }, [allAreas, selectedUser, selectedUserId])

  useEffect(() => {
    if (!selectedUserId || !todayDate || areas.length === 0) {
      setIsPrecheckingAreas(false)
      return
    }

    let isCancelled = false
    setIsPrecheckingAreas(true)

    void Promise.all(
      areas.map(async (area) => {
        try {
          const response = await orderService.check({
            areaId: area.id.toString(),
            date: todayDate,
          })
          return { areaId: area.id, exists: response.exists }
        } catch (error) {
          console.error("[AdminFastOrdersPage] Error checking area:", area.id, error)
          return { areaId: area.id, exists: false }
        }
      })
    ).then((results) => {
      if (isCancelled) return

      const apiBlocked = new Set<number>()
      results.forEach(({ areaId, exists }) => {
        if (exists) {
          apiBlocked.add(areaId)
        }
      })

      setBlockedAreaIds((prev) => {
        const next = new Set(prev)
        apiBlocked.forEach((areaId) => next.add(areaId))
        return next
      })

      setSelectedAreaId((prev) => {
        const availableAreas = areas.filter((area) => !apiBlocked.has(area.id))
        if (prev && availableAreas.some((area) => area.id === prev)) return prev
        return availableAreas[0]?.id
      })

      setIsPrecheckingAreas(false)
    })

    return () => {
      isCancelled = true
    }
  }, [areas, selectedUserId, todayDate])

  const checkOrderData = useMemo(() => {
    if (!selectedAreaId || !selectedUserId) return null
    return {
      areaId: selectedAreaId.toString(),
      date: todayDate,
    }
  }, [selectedAreaId, selectedUserId, todayDate])

  const { data: existingOrderData, isLoading: isCheckingOrder } = useCheckOrderQuery(
    checkOrderData,
    Boolean(checkOrderData)
  ) as { data: CheckOrderResponse | undefined, isLoading: boolean }

  useEffect(() => {
    if (!selectedAreaId || !selectedUserId) {
      setExistingOrder(undefined)
    }
  }, [selectedAreaId, selectedUserId])

  useEffect(() => {
    if (!selectedAreaId) return
    if (!blockedAreaIds.has(selectedAreaId)) return

    const firstAvailable = areas.find((area) => !blockedAreaIds.has(area.id))
    if (firstAvailable) {
      setSelectedAreaId(firstAvailable.id)
    }
  }, [areas, blockedAreaIds, selectedAreaId])

  useEffect(() => {
    const checkedAreaId = checkOrderData?.areaId ? Number.parseInt(checkOrderData.areaId, 10) : undefined

    if (existingOrderData && checkedAreaId) {
      if (existingOrderData.exists) {
        setBlockedAreaIds((prev) => {
          const next = new Set(prev)
          next.add(checkedAreaId)
          return next
        })

        if (existingOrderData.order) {
          setExistingOrder(existingOrderData.order)
        } else {
          setExistingOrder({
            id: 0,
            status: "unknown",
            areaId: checkedAreaId,
            totalAmount: 0,
          })
        }
      } else if (existingOrderData.exists === false) {
        setExistingOrder(undefined)
      }
    } else if (!existingOrderData && checkOrderData && !isCheckingOrder) {
      setExistingOrder(undefined)
    }
  }, [checkOrderData, existingOrderData, isCheckingOrder])

  if (error) {
    console.error("[AdminFastOrdersPage] Error loading products:", error)
  }

  const productUnitOptions = useMemo(() => {
    return products.flatMap((product) => {
      if (!product.productUnits || product.productUnits.length === 0) return []
      return product.productUnits.map((unit) => ({
        key: `${product.id}__${unit.id}`,
        productId: product.id,
        productUnitId: unit.id,
        label: `${product.name} - ${unit.unitMeasurement.name}`,
      }))
    })
  }, [products])

  const filteredProductUnitOptions = useMemo(() => {
    const search = productSearch.trim().toLowerCase()
    if (!search) return []
    return productUnitOptions.filter((option) => option.label.toLowerCase().includes(search)).slice(0, 30)
  }, [productSearch, productUnitOptions])

  const handleAddProductByKey = useCallback((key: string) => {
    if (!selectedUserId || !selectedAreaId) {
      toast.error("Selecciona usuario y area antes de agregar productos.")
      return
    }

    const selectedOption = productUnitOptions.find((option) => option.key === key)
    if (!selectedOption) return

    const product = products.find((p) => p.id === selectedOption.productId)
    if (!product) return

    const selectedProductUnit = product.productUnits?.find((unit) => unit.id === selectedOption.productUnitId)
    const selectedUnit = selectedProductUnit?.unitMeasurement || { id: 0, name: "Unidad", description: "" }
    const selectedUnitId = selectedProductUnit?.id || 0

    const uniqueId = Math.random().toString(36).slice(2, 11)
    const newTableProduct: TableProduct = {
      id: `${product.id}-${selectedUnitId}-${uniqueId}`,
      product,
      quantity: 0,
      selectedUnitId,
      selectedUnit,
      isEditing: true,
    }

    setTableProducts((prev) => [...prev, newTableProduct])
    setProductSearch("")
  }, [productUnitOptions, products, selectedAreaId, selectedUserId])

  const handleUpdateQuantity = useCallback((tableProductId: string, newQuantity: number) => {
    if (newQuantity < 0) return
    const roundedQuantity = Number.parseFloat(newQuantity.toFixed(3))

    setTableProducts((prev) =>
      prev.map((tp) => (tp.id === tableProductId ? { ...tp, quantity: roundedQuantity } : tp)),
    )
  }, [])

  const handleQuantityChange = useCallback((tableProductId: string, nextValue: string) => {
    const cleaned = nextValue.replace(/[^0-9.,]/g, "")
    const normalized = cleaned.replace(",", ".")
    const parts = normalized.split(".")
    const normalizedSingle = parts.length > 1 ? `${parts.shift()}.${parts.join("")}` : normalized

    setQuantityDrafts((prev) => ({ ...prev, [tableProductId]: cleaned }))
    const parsed = Number.parseFloat(normalizedSingle)
    if (Number.isFinite(parsed)) {
      handleUpdateQuantity(tableProductId, parsed)
    }
  }, [handleUpdateQuantity])
  const handleQuantityBlur = useCallback((tableProductId: string) => {
    setQuantityDrafts((prev) => {
      const current = prev[tableProductId]
      const normalized = (current ?? "").replace(",", ".").trim()
      const parsed = Number.parseFloat(normalized)
      if (!normalized) {
        handleUpdateQuantity(tableProductId, 0)
      } else if (Number.isFinite(parsed)) {
        handleUpdateQuantity(tableProductId, parsed)
      }
      const next = { ...prev }
      delete next[tableProductId]
      return next
    })
  }, [handleUpdateQuantity])

  // Update product unit
  const handleUpdateUnit = useCallback((tableProductId: string, newUnitId: number) => {
    setTableProducts(prev => prev.map(tp => {
      if (tp.id === tableProductId) {
        const selectedUnit = tp.product.productUnits?.find(u => u.id === newUnitId)?.unitMeasurement || tp.selectedUnit
        return { ...tp, selectedUnitId: newUnitId, selectedUnit }
      }
      return tp
    }))
  }, [])

  // Remove product from table
  const handleRemoveProduct = useCallback((tableProductId: string) => {
    setTableProducts(prev => prev.filter(tp => tp.id !== tableProductId))
  }, [])

  // Clear all products
  const handleClearAll = useCallback(() => {
    if (tableProducts.length === 0) {
      return
    }

    if (window.confirm(`Deseas eliminar los ${tableProducts.length} productos?`)) {
      setTableProducts([])
      setQuantityDrafts({})
    }
  }, [tableProducts])

  // Create order
  const handleCreateOrder = async () => {
    if (!selectedUserId || !selectedAreaId) {
      toast.error("Por favor selecciona un usuario y un area")
      return
    }

    if (tableProducts.length === 0) {
      toast.error("Por favor agrega al menos un producto")
      return
    }

    if (tableProducts.some((tp) => !tp.quantity || tp.quantity <= 0)) {
      toast.error("No puedes crear un pedido con cantidad 0. Ajusta las cantidades.")
      return
    }

    // Check if there's already an order for this area in the current session
    const orderKey = `${selectedUserId}-${selectedAreaId}`
    if (sessionOrderKeys.has(orderKey)) {
      toast.error("Ya existe un pedido para esta area hoy. Solo se permite un pedido por dia y por area.")
      return
    }

    if (blockedAreaIds.has(selectedAreaId)) {
      toast.error("Esta area ya tiene pedido hoy y esta bloqueada.")
      return
    }
    
    // Check if there's an existing order that's not in 'created' status
    if (existingOrder && existingOrder.status !== 'created') {
      toast.error(`Ya existe una orden con estado "${existingOrder.status}" para esta area hoy. Solo se puede hacer un pedido por dia y por area.`)
      return
    }
    
    // Check if there's an existing order in 'created' status
    if (existingOrder && existingOrder.status === 'created') {
      toast.info("Se agregaran los productos a la orden existente en esta area.")
    }
    
    // If there's an existing order with status 'unknown' (when backend only returns exists: true)
    if (existingOrder && existingOrder.status === 'unknown') {
      toast.error("Ya existe un pedido para esta area hoy. Solo se permite un pedido por dia y por area.")
      return
    }

    setIsCreatingOrder(true)
    try {
      // Crear orderItems con la estructura exacta que espera el backend
      const orderItems = tableProducts.map(tp => {
        // IMPORTANT: Use unitMeasurementId from the selected unit, not the ProductUnit id
        const selectedUnit = tp.product.productUnits?.find(u => u.id === tp.selectedUnitId);
        const unitMeasurementId = selectedUnit?.unitMeasurementId || tp.selectedUnitId;
        
        console.log(`[AdminFastOrdersPage] Product ${tp.product.name}:`, {
          productUnitId: tp.selectedUnitId,
          unitMeasurementId: unitMeasurementId,
          selectedUnit: selectedUnit
        });
        
        const item: CreateOrderItemDto = {
          productId: tp.product.id,
          quantity: tp.quantity,
          price: tp.product.price || 0,
          unitMeasurementId: unitMeasurementId,
        };
        return item;
      });

      const orderData: CreateOrderDto = {
        userId: selectedUserId,
        areaId: selectedAreaId,
        totalAmount: tableProducts.reduce((sum, tp) => sum + (tp.quantity * (tp.product.price || 0)), 0),
        status: 'created',
        observation: orderObservations.trim() || undefined,
        orderItems: orderItems,
      };

      console.log('[AdminFastOrdersPage] Enviando orderData:', JSON.stringify(orderData, null, 2))
      
      const result = await createOrderMutation.mutateAsync(orderData)
      
      // Add this area to session orders to prevent duplicates
      if (result) {
        setSessionOrderKeys((prev) => new Set([...prev, orderKey]))
      }
       
      // Reset form
      setTableProducts([])
      setQuantityDrafts({})
      setOrderObservations("")
      setExistingOrder(undefined)
      setBlockedAreaIds((prev) => {
        const next = new Set(prev)
        next.add(selectedAreaId)
        return next
      })
      const createdOrderId = result && typeof result === "object" && "id" in result ? Number((result as { id?: number }).id) : undefined
      if (createdOrderId) {
        router.push(`/dashboard/orders?openOrderId=${createdOrderId}`)
      } else {
        router.push("/dashboard/orders")
      }
    } catch (error: unknown) {
      console.error("Error creating order:", error)
      toast.error("Error al crear el pedido. Por favor intenta de nuevo.")
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const stats = useMemo(() => ({
    totalProducts: tableProducts.length,
    totalItems: tableProducts.reduce((sum, tp) => sum + tp.quantity, 0),
    totalPrice: 0 // Price calculation removed from frontend
  }), [tableProducts])

  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Ordenes</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nueva orden</h1>
                <p className="text-sm text-gray-500">Crea pedidos para usuarios y areas.</p>
              </div>
              {stats.totalProducts > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="h-10 px-4 gap-2">
                <Link href="/dashboard/orders">
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Link>
              </Button>
              {stats.totalProducts > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="h-10 px-4"
                >
                  Limpiar Todo
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {/* User, Area and Product Selection */}
          <div className="mb-6 grid gap-5 grid-cols-1 sm:grid-cols-3">
            {/* User Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Usuario
              </label>
              <Select 
                value={selectedUserId?.toString()} 
                onValueChange={(value) => {
                  setSelectedUserId(parseInt(value))
                  setSelectedAreaId(undefined) // Reset area when user changes
                  setExistingOrder(undefined) // Reset existing order
                }}
              >
                <SelectTrigger className="rounded-lg border-gray-300" data-testid="user-select">
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Cargando usuarios...
                    </div>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No hay usuarios disponibles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Area Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Area</label>
              <Select 
                value={selectedAreaId?.toString()} 
                onValueChange={(value) => setSelectedAreaId(parseInt(value))}
                disabled={!selectedUserId || isPrecheckingAreas}
              >
                <SelectTrigger className="rounded-lg border-gray-300">
                  <SelectValue placeholder={selectedUserId ? "Selecciona un area..." : "Selecciona un usuario primero..."} />
                </SelectTrigger>
                <SelectContent>
                  {areas.length > 0 ? (
                    areas.map((area) => {
                      const isBlocked = blockedAreaIds.has(area.id)
                      return (
                        <SelectItem key={area.id} value={area.id.toString()} disabled={isBlocked}>
                          {area.name}{isBlocked ? " (bloqueada)" : ""}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {selectedUserId ? "No hay areas disponibles" : "Selecciona un usuario primero"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedAreaId && blockedAreaIds.has(selectedAreaId) && (
                <p className="mt-2 text-xs text-red-600">Bloqueada: esta area ya tiene pedido hoy.</p>
              )}
              {isPrecheckingAreas && (
                <p className="mt-2 text-xs text-blue-600">Verificando bloqueo de areas...</p>
              )}
              {/* Order Status */}
              {existingOrder && (
                <div className={`mt-2 p-2 rounded-md text-xs ${
                  existingOrder.status === 'created' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="font-medium">
                    {existingOrder.status === 'created' ? 'Orden abierta' : 
                     existingOrder.status === 'unknown' ? 'Pedido existente' : 'Orden cerrada'}
                  </div>
                  <div>
                    Estado: <span className="font-medium">
                      {existingOrder.status === 'created' ? 'Abierta' :
                       existingOrder.status === 'unknown' ? 'Existente' : existingOrder.status}
                    </span>
                  </div>
                  {existingOrder.id !== 0 && (
                    <div>
                      ID: <span className="font-medium">#{existingOrder.id}</span>
                    </div>
                  )}
                  {existingOrder.status === 'created' ? (
                    <div>Puedes agregar mas productos a esta orden</div>
                  ) : (
                    <div>No se pueden crear mas pedidos hoy para esta area</div>
                  )}
                </div>
              )}
               
              {/* Checking Status */}
              {isCheckingOrder && (
                <div className="mt-2 p-2 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="font-medium">Verificando pedidos existentes...</div>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <label htmlFor="admin-product-search" className="text-sm font-semibold text-gray-700 block mb-3">
                Buscar producto
              </label>
              <div className="space-y-3">
                <Input
                  id="admin-product-search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre producto - unidad (agrega con clic)"
                  className="rounded-lg border-gray-300"
                  disabled={!selectedUserId || !selectedAreaId}
                />
                {!selectedUserId || !selectedAreaId ? (
                  <div className="px-1 text-sm text-gray-500">Selecciona usuario y area para agregar productos</div>
                ) : productSearch.trim().length === 0 ? (
                  <div className="px-1 text-sm text-gray-500">Escribe para buscar productos</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {filteredProductUnitOptions.length > 0 ? (
                      filteredProductUnitOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleAddProductByKey(option.key)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{option.label}</span>
                          <Plus className="h-4 w-4 flex-shrink-0 text-green-600" />
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-gray-500">No hay coincidencias</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Producto
                    </th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Presentacion
                     </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cantidad
                      </th>
                     <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                       Acciones
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-8 bg-gray-300 rounded w-16 mx-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : tableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-4 p-3 bg-gray-100 rounded-full">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Tabla vacia</h3>
                          <p className="text-gray-600 mt-2">Selecciona un usuario, un area y busca productos para agregarlos automaticamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableProducts.map((tableProduct) => {
                      const { product, quantity, id, selectedUnit, isEditing } = tableProduct
                      const draftValue = quantityDrafts[id]
                      const displayQuantity = Number.isFinite(quantity) ? quantity : 0
                      const inputValue = draftValue ?? String(displayQuantity)

                      return (
                        <tr key={id} className="hover:bg-gray-50 transition-colors duration-150">
                          {/* Producto */}
                          <td className="px-6 py-4">
                             <div>
                               <div className="text-sm font-medium text-gray-900">{product.name}</div>
                               <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                             </div>
                          </td>
                          
                          {/* Presentacion */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <Select
                                value={tableProduct.selectedUnitId.toString()}
                                onValueChange={(value) => handleUpdateUnit(id, parseInt(value))}
                              >
                                <SelectTrigger className="h-10 w-48 border border-gray-300 bg-white rounded-lg font-semibold">
                                  <SelectValue placeholder="Selecciona presentacion" />
                                </SelectTrigger>
                                <SelectContent>
                                  {product.productUnits?.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                      {unit.unitMeasurement.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="inline-block">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-1.5 text-sm font-semibold rounded-lg cursor-default">
                                  {selectedUnit.name}
                                </Badge>
                              </div>
                            )}
                          </td>
                          
                           {/* Cantidad */}
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center gap-2">
                               <Input
                                 type="text"
                                 inputMode="decimal"
                                 pattern="^\\d*(?:[\\.,]\\d+)?$"
                                 value={inputValue}
                                 onChange={(e) => handleQuantityChange(id, e.target.value)}
                                 onBlur={() => handleQuantityBlur(id)}
                                 className="w-20 h-8 text-center border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30"
                               />
                               <span className="text-sm text-gray-600 min-w-fit">
                                 {selectedUnit.name}
                               </span>
                             </div>
                           </td>
                           
                          {/* Acciones */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveProduct(id)}
                                className="h-8 px-3 text-red-700 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 bg-red-50 font-medium"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200 mb-2" />
                    <div className="h-3 w-1/2 rounded bg-gray-200 mb-3" />
                    <div className="h-9 w-full rounded bg-gray-200" />
                  </div>
                ))
              ) : tableProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mb-3 inline-flex rounded-full bg-gray-100 p-3">
                    <Package className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Tabla vacia</h3>
                  <p className="mt-1 text-sm text-gray-600">Busca productos para agregarlos automaticamente</p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    <span>Producto</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-center">Accion</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {tableProducts.map((tableProduct) => {
                      const { product, quantity, id, selectedUnit } = tableProduct
                      const draftValue = quantityDrafts[id]
                      const displayQuantity = Number.isFinite(quantity) ? quantity : 0
                      const inputValue = draftValue ?? String(displayQuantity)
                      return (
                        <div key={id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                            <p className="text-[11px] text-gray-500">{selectedUnit.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="^\\d*(?:[\\.,]\\d+)?$"
                              value={inputValue}
                              onChange={(e) => handleQuantityChange(id, e.target.value)}
                              onBlur={() => handleQuantityBlur(id)}
                              className="w-20 h-8 text-center border border-gray-300 bg-white focus-visible:ring-2 focus-visible:ring-primary/30"
                            />
                          </div>
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(id)}
                              className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {tableProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <div className="flex flex-col gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold">Productos:</span> <span className="font-semibold text-lg text-green-600">{stats.totalProducts}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-bold">Unidades:</span> <span className="font-semibold text-lg text-green-600">{stats.totalItems}</span>
                  {selectedUser && (
                    <>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="font-bold">Usuario:</span> <span className="font-semibold text-lg text-green-600">{selectedUser.firstName} {selectedUser.lastName}</span>
                    </>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={orderObservations}
                    onChange={(e) => setOrderObservations(e.target.value)}
                    placeholder="Notas especiales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateOrder}
                    disabled={!selectedUserId || !selectedAreaId || isCreatingOrder || (selectedAreaId ? blockedAreaIds.has(selectedAreaId) : false) || (existingOrder && existingOrder.status !== 'created')}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isCreatingOrder
                      ? "Procesando..."
                      : (existingOrder && existingOrder.status === 'created' ? "Agregar a Orden" : "Crear Orden")
                    }
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Suspense>
  )
}

export default AdminFastOrdersPage
