"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { Package, Plus, Trash2, Send } from "lucide-react"
import { useProductsQuery } from "@/lib/api/hooks/useProduct"
import { useCreateOrderMutation, useCheckOrderQuery } from "@/lib/api/hooks/useOrder"
import { useMeQuery } from "@/lib/api/hooks/useUsers"
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
import { useRouter } from "next/navigation"

interface TableProduct {
  id: string
  product: Product
  quantity: number // Supports decimal values
  selectedUnitId: number
  selectedUnit: ProductUnit["unitMeasurement"]
  isEditing: boolean
}

const FastOrdersPage = () => {
  const router = useRouter()
  const [tableProducts, setTableProducts] = useState<TableProduct[]>([])
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})
  const [productSearch, setProductSearch] = useState("")
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>()
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [areas, setAreas] = useState<Array<{id: number; name: string}>>([])
  const [blockedAreaIds, setBlockedAreaIds] = useState<Set<number>>(new Set())
  const [isPrecheckingAreas, setIsPrecheckingAreas] = useState(false)
  const [orderObservations, setOrderObservations] = useState<string>("")
  const [existingOrder, setExistingOrder] = useState<{id: number; status: string; areaId: number; totalAmount: number} | undefined>(undefined)
  const [todayDate, setTodayDate] = useState("")
  const nextTableRowId = useRef(1)
  
  // Track orders created in this session to prevent duplicates
  const [sessionOrders, setSessionOrders] = useState<Set<number>>(new Set())
  const createOrderMutation = useCreateOrderMutation()
  
  // Prevent hydration mismatches by only rendering after component is mounted
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current user and products
  const { data: currentUser } = useMeQuery()
  const { data: productsData, isLoading, error } = useProductsQuery()
  const products = useMemo(() => productsData?.items || [], [productsData?.items])
  
  // Compute date on client only to avoid server/client render drift.
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    setTodayDate(formatter.format(new Date()))
  }, [])

  // Check for existing order when area is selected
  const checkOrderData = useMemo(() => {
    if (!selectedAreaId || !currentUser?.id || !todayDate) return null
    const data = {
      areaId: selectedAreaId.toString(),
      date: todayDate // Use stable date
    }
    console.log('[FastOrdersPage] checkOrderData:', data)
    return data
  }, [selectedAreaId, currentUser?.id, todayDate])
  
  const { data: existingOrderData, isLoading: isCheckingOrder } = useCheckOrderQuery(
    checkOrderData, 
    Boolean(checkOrderData)
  ) as { data: CheckOrderResponse | undefined, isLoading: boolean }

  // Load areas when user data is available
  useEffect(() => {
    console.log("[FastOrdersPage] currentUser:", currentUser)
    console.log("[FastOrdersPage] User object keys:", currentUser ? Object.keys(currentUser) : 'No user')
    
    // Check if user has areas embedded in the response
    const userAreas = (currentUser as User & {areas?: Array<{id: number; name: string}>})?.areas || []
    const userAreaIds = currentUser?.areaIds || []
    
    console.log("[FastOrdersPage] userAreas (embedded):", userAreas)
    console.log("[FastOrdersPage] userAreaIds:", userAreaIds)
    
    if (userAreas.length > 0) {
      // Use embedded areas if available
      console.log("[FastOrdersPage] Using embedded areas:", userAreas)
      setAreas(userAreas)
    } else if (userAreaIds.length > 0) {
      console.log("[FastOrdersPage] User has areaIds but no embedded areas. areaIds:", userAreaIds)
      // Could load areas by IDs here if needed
      const mappedAreas = userAreaIds.map(id => ({ id, name: `Area ${id}` }))
      setAreas(mappedAreas)
    } else {
      console.log("[FastOrdersPage] No areas found for user")
      setAreas([])
      setSelectedAreaId(undefined)
    }
  }, [currentUser])

  useEffect(() => {
    if (!todayDate || areas.length === 0) {
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
          console.error("[FastOrdersPage] Error checking area:", area.id, error)
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
        sessionOrders.forEach((areaId) => next.add(areaId))
        return next
      })

      setSelectedAreaId((prev) => {
        const availableAreas = areas.filter((area) => !apiBlocked.has(area.id) && !sessionOrders.has(area.id))
        if (prev && availableAreas.some((area) => area.id === prev)) return prev
        return availableAreas[0]?.id
      })

      setIsPrecheckingAreas(false)
    })

    return () => {
      isCancelled = true
    }
  }, [areas, sessionOrders, todayDate])

  // Reset existing order when there is no area selected
  useEffect(() => {
    if (!selectedAreaId || !currentUser?.id) {
      setExistingOrder(undefined)
    }
  }, [selectedAreaId, currentUser])

  useEffect(() => {
    if (!selectedAreaId) return
    if (!blockedAreaIds.has(selectedAreaId)) return

    const firstAvailable = areas.find((area) => !blockedAreaIds.has(area.id))
    if (firstAvailable) {
      setSelectedAreaId(firstAvailable.id)
    }
  }, [areas, blockedAreaIds, selectedAreaId])
  
  // Handle existing order found
  useEffect(() => {
    if (existingOrderData && checkOrderData) {
      console.log('[FastOrdersPage] Existing order data from check:', existingOrderData)
      console.log('[FastOrdersPage] exists value:', existingOrderData.exists)
      console.log('[FastOrdersPage] order value:', existingOrderData.order)
      
      if (existingOrderData.exists) {
        if (selectedAreaId) {
          setBlockedAreaIds((prev) => {
            const next = new Set(prev)
            next.add(selectedAreaId)
            return next
          })
        }

        // Si existe una orden (con o sin detalles del objeto order)
        if (existingOrderData.order) {
          setExistingOrder(existingOrderData.order)
          
          // Show toast notification about existing order
          if (existingOrderData.order.status === 'created') {
            toast.info(`Ya existe una orden creada hoy para esta área. Puedes agregar más productos.`)
          } else {
            toast.warning(`Ya existe una orden (${existingOrderData.order.status}) para esta área hoy. No se pueden crear más pedidos.`)
          }
        } else {
          // Si existe pero no hay detalles del objeto, crear un objeto genérico para bloquear
          const blockOrder = {
            id: 0,
            status: 'unknown',
            areaId: selectedAreaId || 0,
            totalAmount: 0
          }
          setExistingOrder(blockOrder)
          console.log('[FastOrdersPage] Blocking with generic order:', blockOrder)
          toast.warning(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
        }
      } else if (existingOrderData.exists === false) {
        console.log('[FastOrdersPage] No existing order found according to backend check')
        // Set to undefined to let fallback potentially find it
        setExistingOrder(undefined)
      }
    } else if (!existingOrderData && checkOrderData && !isCheckingOrder) {
      console.log('[FastOrdersPage] No order data returned from check')
    }
  }, [existingOrderData, checkOrderData, isCheckingOrder, selectedAreaId])

  // Handle errors
  if (error) {
    console.error("[FastOrdersPage] Error loading products:", error)

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

    return productUnitOptions
      .filter((option) => option.label.toLowerCase().includes(search))
      .slice(0, 30)
  }, [productSearch, productUnitOptions])

  const handleAddProductByKey = useCallback((key: string) => {
    const selectedOption = productUnitOptions.find((option) => option.key === key)
    if (!selectedOption) return

    const product = products.find((p) => p.id === selectedOption.productId)
    if (!product) return

    const selectedProductUnit = product.productUnits?.find((unit) => unit.id === selectedOption.productUnitId)
    const selectedUnit = selectedProductUnit?.unitMeasurement || { id: 0, name: "Unidad", description: "" }
    const selectedUnitId = selectedProductUnit?.id || 0

    const uniqueId = nextTableRowId.current++
    const newTableProduct: TableProduct = {
      id: `${product.id}-${selectedUnitId}-${uniqueId}`,
      product,
      quantity: 0,
      selectedUnitId: selectedUnitId,
      selectedUnit: selectedUnit,
      isEditing: true,
    }

    setTableProducts((prev) => [...prev, newTableProduct])
    setProductSearch("")
  }, [productUnitOptions, products])
  // Update product quantity preserving decimal input
  const handleUpdateQuantity = useCallback((tableProductId: string, newQuantity: number) => {
    if (newQuantity < 0) return

    const roundedQuantity = Number.parseFloat(newQuantity.toFixed(3))

    setTableProducts(prev => prev.map(tp => {
      if (tp.id === tableProductId) {
        return { ...tp, quantity: roundedQuantity }
      }
      return tp
    }))
  }, [])

  const handleQuantityChange = useCallback((tableProductId: string, nextValue: string) => {
    const cleaned = nextValue.replace(/[^0-9.,]/g, "")
    const normalized = cleaned.replace(",", ".")
    const parts = normalized.split(".")
    const normalizedSingle =
      parts.length > 1 ? `${parts.shift()}.${parts.join("")}` : normalized

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
    setTableProducts(prev => {
      const product = prev.find(tp => tp.id === tableProductId)
      if (product) {
    
      }
      return prev.filter(tp => tp.id !== tableProductId)
    })
  }, [])

  // Clear all products
  const handleClearAll = useCallback(() => {
    if (tableProducts.length === 0) {
  
      return
    }

    if (window.confirm(`¿Deseas eliminar los ${tableProducts.length} productos?`)) {
      setTableProducts([])
  
    }
  }, [tableProducts])

  // Create order
  const handleCreateOrder = useCallback(async () => {
    if (!selectedAreaId) {
      return
    }

    if (tableProducts.length === 0) {
      return
    }

    if (tableProducts.some((tp) => !tp.quantity || tp.quantity <= 0)) {
      toast.error("No puedes crear un pedido con cantidad 0. Ajusta las cantidades.")
      return
    }

    if (!currentUser?.id) {
  
      return
    }

    if (selectedAreaId && blockedAreaIds.has(selectedAreaId)) {
      toast.error("Esta area ya tiene un pedido hoy y esta bloqueada.")
      return
    }

    // Check if there's already an order for this area in the current session
    if (selectedAreaId && sessionOrders.has(selectedAreaId)) {
      toast.error(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order that's not in 'created' status
    if (existingOrder && existingOrder.status !== 'created') {
      toast.error(`Ya existe una orden con estado "${existingOrder.status}" para esta área hoy. Solo se puede hacer un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order in 'created' status
    if (existingOrder && existingOrder.status === 'created') {
      toast.info(`Se agregarán los productos a la orden existente en esta área.`)
    }
    
    // If there's an existing order with status 'unknown' (when backend only returns exists: true)
    if (existingOrder && existingOrder.status === 'unknown') {
      toast.error(`Ya existe un pedido para esta área hoy. Solo se permite un pedido por día y por área.`)
      return
    }
    
    // Check if there's an existing order in 'created' status
    if (existingOrder && existingOrder.status === 'created') {
  
    }
    
    // If there's an existing order with status 'unknown' (when backend only returns exists: true)
    if (existingOrder && existingOrder.status === 'unknown') {
  
      return
    }

    setIsCreatingOrder(true)
    try {
      // Crear orderItems con la estructura exacta que espera el backend
      const orderItems = tableProducts.map(tp => {
        // IMPORTANT: Use unitMeasurementId from the selected unit, not the ProductUnit id
        const selectedUnit = tp.product.productUnits?.find(u => u.id === tp.selectedUnitId);
        const unitMeasurementId = selectedUnit?.unitMeasurementId || tp.selectedUnitId;
        
        console.log(`[FastOrdersPage] Product ${tp.product.name}:`, {
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
        userId: currentUser.id, // Validado arriba, así que siempre existe
        areaId: selectedAreaId,
        totalAmount: tableProducts.reduce((sum, tp) => sum + (tp.quantity * (tp.product.price || 0)), 0),
        status: "created",
        observation: orderObservations.trim() || undefined,
        orderItems: orderItems,
      };

      console.log('[FastOrdersPage] Enviando orderData:', JSON.stringify(orderData, null, 2))
      
      const result = await createOrderMutation.mutateAsync(orderData)
      const createdOrderId = typeof result?.id === "number" ? result.id : null
      
      // Add this area to session orders to prevent duplicates
      if (result && selectedAreaId) {
        setSessionOrders(prev => new Set([...prev, selectedAreaId]))
        setBlockedAreaIds((prev) => {
          const next = new Set(prev)
          next.add(selectedAreaId)
          return next
        })
        console.log('[FastOrdersPage] Added area to session orders:', selectedAreaId)
      }
  
       
// Reset form
      setTableProducts([])
      setOrderObservations("")
      setExistingOrder(selectedAreaId ? {
        id: 0,
        status: "unknown",
        areaId: selectedAreaId,
        totalAmount: 0,
      } : undefined)
      if (selectedAreaId) {
        const nextArea = areas.find((area) => area.id !== selectedAreaId && !blockedAreaIds.has(area.id))
        if (nextArea) {
          setSelectedAreaId(nextArea.id)
        }
      }
      toast.success("Orden creada con exito")
      if (createdOrderId) {
        router.push(`/users/history?orderId=${createdOrderId}`)
      } else {
        router.push("/users/history")
      }
      
    } catch (error: unknown) {
      console.error("Error creating order:", error)
      toast.error("No se pudo crear la orden")
    } finally {
      setIsCreatingOrder(false)
    }
  }, [areas, blockedAreaIds, createOrderMutation, currentUser?.id, existingOrder, orderObservations, router, selectedAreaId, sessionOrders, tableProducts])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter = Create order
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        if (tableProducts.length > 0 && selectedAreaId) {
          void handleCreateOrder()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleCreateOrder, selectedAreaId, tableProducts.length])

  const stats = useMemo(() => ({
    totalProducts: tableProducts.length,
    totalItems: tableProducts.reduce((sum, tp) => sum + tp.quantity, 0),
    totalPrice: 0 // Price calculation removed from frontend
  }), [tableProducts])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50" />
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
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Pedidos</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pedidos rapidos</h1>
                <p className="text-sm text-gray-500">Registra pedidos de forma rapida por area.</p>
              </div>
              {stats.totalProducts > 0 && (
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {stats.totalProducts} producto{stats.totalProducts !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
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
          {/* Area and Product Selection */}
          <div className="mb-6 grid gap-5 grid-cols-1 sm:grid-cols-2">
            {/* Area Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Area</label>
              <Select
                value={selectedAreaId?.toString()}
                onValueChange={(value) => setSelectedAreaId(parseInt(value))}
                disabled={isPrecheckingAreas || areas.length === 0}
              >
                <SelectTrigger className="rounded-lg border-gray-300">
                  <SelectValue placeholder="Selecciona un área..." />
                </SelectTrigger>
                <SelectContent>
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()} disabled={blockedAreaIds.has(area.id)}>
                        {area.name}{blockedAreaIds.has(area.id) ? " (bloqueada)" : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {currentUser ? "Cargando áreas..." : "Esperando datos del usuario..."}
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
                    {existingOrder.status === 'created' ? '📝 Orden abierta' : 
                     existingOrder.status === 'unknown' ? '🚫 Pedido existente' : '🚫 Orden cerrada'}
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
                    <div>Puedes agregar más productos a esta orden</div>
                  ) : (
                    <div>No se pueden crear más pedidos hoy para esta área</div>
                  )}
                </div>
              )}
              
              {/* Checking Status */}
              {isCheckingOrder && (
                <div className="mt-2 p-2 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  <div className="font-medium">🔍 Verificando pedidos existentes...</div>
                </div>
              )}
               
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-md">
              <label htmlFor="fast-product-search" className="text-sm font-semibold text-gray-700 block mb-3">
                Buscar producto
              </label>
              <div className="space-y-3">
                <Input
                  id="fast-product-search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre producto - unidad (agrega con clic)"
                  className="rounded-lg border-gray-300"
                />
                {productSearch.trim().length > 0 ? (
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
                ) : (
                  <p className="text-xs text-gray-500">Escribe para buscar y agrega con clic.</p>
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
                       Presentación
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
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-4 p-3 bg-gray-100 rounded-full">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Tabla vacía</h3>
                          <p className="text-gray-600 mt-2">Busca productos para agregarlos automáticamente</p>
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
                          
                          {/* Presentación */}
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <Select
                                value={tableProduct.selectedUnitId.toString()}
                                onValueChange={(value) => handleUpdateUnit(id, parseInt(value))}
                              >
                                <SelectTrigger className="h-10 w-48 border border-gray-300 bg-white rounded-lg font-semibold">
                                  <SelectValue placeholder="Selecciona presentación" />
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  <span className="font-bold">Productos:</span> <span className="font-semibold text-lg text-green-600">{stats.totalProducts}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="font-bold">Cantidad total:</span> <span className="font-semibold text-lg text-green-600">{stats.totalItems}</span>
                </div>
                 <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <textarea
                      value={orderObservations}
                      onChange={(e) => setOrderObservations(e.target.value)}
                      placeholder="Observaciones (opcional)"
                      className="h-10 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none sm:w-64"
                    />
                    <Button
                      onClick={() => void handleCreateOrder()}
                      disabled={
                        !selectedAreaId ||
                        isCreatingOrder ||
                        (selectedAreaId ? blockedAreaIds.has(selectedAreaId) : false) ||
                        (existingOrder && existingOrder.status !== 'created')
                      }
                      className="w-full rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 sm:w-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isCreatingOrder 
                        ? "Creando..." 
                        : (existingOrder && existingOrder.status === 'created' ? "Agregar a Orden" : "Crear Orden")
                      }
                    </Button>
                   <Badge variant="outline" className="hidden border-gray-700 bg-gray-800 text-xs font-mono text-white sm:inline-flex">
                     ⌘ Ctrl+Enter
                   </Badge>
                 </div>
              </div>
            </div>
          )}
        </main>

      </div>
    </Suspense>
  )
}

export default FastOrdersPage










