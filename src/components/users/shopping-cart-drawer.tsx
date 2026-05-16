"use client"

import type React from "react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Minus, Plus, ShoppingCart, Trash2, Loader2, Printer, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { areaService, orderService, useCreateOrderMutation, usersService } from "@/lib/api"
import type { Area } from "@/types/area"
import type { User } from "@/types/users"
import type { CreateOrderDto } from "@/types/order"

// Alternative user interface with areas instead of areaIds
interface UserWithAreas extends Omit<User, 'areaIds'> {
  areas: Array<{
    id: number
    name: string
    description?: string
  }>
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
  productUnits: Array<{
    id: number
    productId: number
    unitMeasurementId: number
    unitMeasurement: {
      id: number
      name: string
      description: string
    }
  }>
  quantity: number
  selectedUnitId: number
  cartItemId?: string
  rating?: number
}

interface ShoppingCartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: Product[]
  availableProducts: Omit<Product, "quantity" | "selectedUnitId" | "cartItemId">[]
  onAddItem: (product: Omit<Product, "quantity" | "selectedUnitId" | "cartItemId">, selectedUnitId: number, quantity: number) => void
  onChangeItemUnit: (item: Product, nextUnitMeasurementId: number) => void
  onUpdateQuantity: (productId: number, selectedUnitId: number, quantity: number, cartItemId?: string) => void
  onRemoveItem: (productId: number, selectedUnitId: number, cartItemId?: string) => void
  onClearCart: () => void
  totalPrice: number
}

const QUANTITY_LIMITS = {
  MIN: 0.001,
  MAX: 9999,
  STEP: 0.25,
} as const

function formatQuantity(quantity: number): string {
  if (quantity % 1 === 0) {
    return quantity.toFixed(0)
  }
  return Number.parseFloat(quantity.toFixed(2)).toString().replace(".", ",")
}

export function ShoppingCartDrawer({
  isOpen,
  onClose,
  cart,
  availableProducts,
  onAddItem,
  onChangeItemUnit,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  totalPrice,
}: ShoppingCartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [blockedAreaIds, setBlockedAreaIds] = useState<Set<number>>(new Set())
  const [selectedAreaId, setSelectedAreaId] = useState<string>("")
  const [productSearch, setProductSearch] = useState("")
  const [newProductId, setNewProductId] = useState<number | null>(null)
  const [newSelectedUnitId, setNewSelectedUnitId] = useState<string>("")
  const [newQuantity, setNewQuantity] = useState<string>("1")
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({})
  const [editingQuantityKey, setEditingQuantityKey] = useState<string | null>(null)
  const [observation, setObservation] = useState("")
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [isCheckingAreas, setIsCheckingAreas] = useState(false)
  const createOrderMutation = useCreateOrderMutation()
  const todayDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return formatter.format(new Date())
  }, [])
  const allAreasBlocked = useMemo(
    () => areas.length > 0 && areas.every((a) => blockedAreaIds.has(a.id)),
    [areas, blockedAreaIds],
  )

  const getCartItemKey = useCallback(
    (item: Product) => item.cartItemId || `${item.id}-${item.selectedUnitId}`,
    [],
  )

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return availableProducts.slice(0, 12)
    return availableProducts
      .filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query))
      .slice(0, 12)
  }, [availableProducts, productSearch])

  const selectedNewProduct = useMemo(
    () => availableProducts.find((product) => product.id === newProductId) ?? null,
    [availableProducts, newProductId],
  )

  const fetchAreas = useCallback(async () => {
    try {
      setIsLoadingAreas(true)

      const currentUser = await usersService.getMe()
      const currentUserAreaIds = Array.isArray(currentUser?.areaIds)
        ? currentUser.areaIds
        : currentUser && 'areas' in currentUser && Array.isArray((currentUser as UserWithAreas).areas)
          ? (currentUser as UserWithAreas).areas.map((area) => area.id)
          : null
      console.log("[v0] Usuario actual:", currentUser)
      console.log("[v0] Areas del usuario:", currentUserAreaIds)

      if (!currentUserAreaIds || currentUserAreaIds.length === 0) {
        toast.error("No tienes areas asignadas")
        setAreas([])
        return
      }

      const allAreas = await areaService.getAll()
      const userAreas = allAreas.filter((area: Area) => currentUserAreaIds.includes(area.id))

      console.log("[v0] Areas filtradas:", userAreas)

      setAreas(userAreas)
      if (userAreas.length > 0) {
        setSelectedAreaId(userAreas[0].id.toString())
      }

      // Block areas that already have an order today
      setIsCheckingAreas(true)
      try {
        const blockedIds = await Promise.all(
          userAreas.map(async (area) => {
            try {
              const check = await orderService.check({ areaId: area.id.toString(), date: todayDate })
              return check.exists ? area.id : null
            } catch (error) {
              console.warn("[shopping-cart-drawer] Error checking order for area:", area.id, error)
              return null
            }
          }),
        )

        const blocked = new Set<number>(blockedIds.filter((id): id is number => typeof id === "number"))
        setBlockedAreaIds(blocked)

        const firstAvailable = userAreas.find((a) => !blocked.has(a.id))
        if (firstAvailable) {
          setSelectedAreaId(firstAvailable.id.toString())
        }
      } finally {
        setIsCheckingAreas(false)
      }
    } catch (error) {
      console.warn("[v0] Error cargando usuario, no se cargaran areas:", error)
      toast.error("Error al cargar el usuario actual")
      setAreas([])
    } finally {
      setIsLoadingAreas(false)
    }
  }, [todayDate])

  // Cargar áreas disponibles
  useEffect(() => {
    if (isOpen) {
      fetchAreas()
    }
  }, [fetchAreas, isOpen])

  useEffect(() => {
    setQuantityInputs((prev) => {
      const next: Record<string, string> = {}
      for (const item of cart) {
        const key = getCartItemKey(item)
        const isEditingThisItem = editingQuantityKey === key
        next[key] = isEditingThisItem && prev[key] !== undefined ? prev[key] : formatQuantity(item.quantity)
      }
      return next
    })
  }, [cart, editingQuantityKey, getCartItemKey])

  useEffect(() => {
    if (!selectedAreaId) return
    const asNumber = Number(selectedAreaId)
    if (!Number.isFinite(asNumber)) return

    if (blockedAreaIds.has(asNumber)) {
      const firstAvailable = areas.find((a) => !blockedAreaIds.has(a.id))
      if (firstAvailable) {
        setSelectedAreaId(firstAvailable.id.toString())
        toast.error("Esa área ya tiene un pedido hoy. Selecciona otra área.")
      }
    }
  }, [areas, blockedAreaIds, selectedAreaId])

  const handleQuantityInputChange = useCallback(
    (item: Product, value: string) => {
      const key = getCartItemKey(item)
      const normalizedValue = value.replace(",", ".")
      const regex = /^\d*([.,]\d{0,3})?$/
      if (!regex.test(value) && value !== "") return

      setQuantityInputs((prev) => ({ ...prev, [key]: value }))

      if (normalizedValue === "") return
      const parsed = Number.parseFloat(normalizedValue)
      if (!Number.isFinite(parsed) || parsed <= 0) return

      const rounded = Math.round(parsed * 1000) / 1000
      onUpdateQuantity(
        item.id,
        item.selectedUnitId,
        Math.min(QUANTITY_LIMITS.MAX, Math.max(QUANTITY_LIMITS.MIN, rounded)),
        item.cartItemId,
      )
    },
    [getCartItemKey, onUpdateQuantity],
  )

  const handleQuantityInputBlur = useCallback(
    (item: Product) => {
      const key = getCartItemKey(item)
      const raw = quantityInputs[key] ?? ""
      const parsed = Number.parseFloat(raw.replace(",", "."))
      setEditingQuantityKey((current) => (current === key ? null : current))

      if (!Number.isFinite(parsed) || parsed <= 0) {
        setQuantityInputs((prev) => ({ ...prev, [key]: formatQuantity(item.quantity) }))
        return
      }

      const rounded = Math.round(parsed * 1000) / 1000
      const clamped = Math.min(QUANTITY_LIMITS.MAX, Math.max(QUANTITY_LIMITS.MIN, rounded))
      onUpdateQuantity(item.id, item.selectedUnitId, clamped, item.cartItemId)
      setQuantityInputs((prev) => ({ ...prev, [key]: formatQuantity(clamped) }))
    },
    [getCartItemKey, onUpdateQuantity, quantityInputs],
  )

  const handlePrint = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("El carrito esta vacio")
      return
    }

    if (!selectedAreaId) {
      toast.error("Selecciona un area para imprimir")
      return
    }

    try {
      setIsPrinting(true)

      const selectedArea = areas.find((area) => area.id.toString() === selectedAreaId)
      const payload = {
        areaName: selectedArea?.name ?? "Area no especificada",
        observation: observation || "",
        items: cart.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          unitName:
            item.productUnits.find((unit) => unit.unitMeasurement.id === item.selectedUnitId)?.unitMeasurement.name ??
            "Unidad",
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar la impresion")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, "_blank", "noopener,noreferrer")

      if (!win) {
        const tempLink = document.createElement("a")
        tempLink.href = url
        tempLink.target = "_blank"
        tempLink.rel = "noopener noreferrer"
        tempLink.click()
      }

      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success("Impresion lista")
    } catch (error) {
      console.error("[shopping-cart-drawer] Error al imprimir:", error)
      toast.error("Error al generar la impresion")
    } finally {
      setIsPrinting(false)
    }
  }, [areas, cart, observation, selectedAreaId])

  const handleDownload = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("El carrito esta vacio")
      return
    }

    if (!selectedAreaId) {
      toast.error("Selecciona un area para descargar")
      return
    }

    try {
      setIsDownloading(true)

      const selectedArea = areas.find((area) => area.id.toString() === selectedAreaId)
      const payload = {
        areaName: selectedArea?.name ?? "Area no especificada",
        observation: observation || "",
        items: cart.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          unitName:
            item.productUnits.find((unit) => unit.unitMeasurement.id === item.selectedUnitId)?.unitMeasurement.name ??
            "Unidad",
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("No se pudo generar la descarga")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-${selectedAreaId}-${todayDate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success("Descarga iniciada")
    } catch (error) {
      console.error("[shopping-cart-drawer] Error al descargar:", error)
      toast.error("Error al descargar PDF")
    } finally {
      setIsDownloading(false)
    }
  }, [areas, cart, observation, selectedAreaId, todayDate])

  const handleSelectNewProduct = useCallback((productId: number) => {
    const product = availableProducts.find((item) => item.id === productId)
    if (!product) return

    const firstUnitId = product.productUnits[0]?.unitMeasurement.id
    setNewProductId(productId)
    setNewSelectedUnitId(firstUnitId ? firstUnitId.toString() : "")
    setProductSearch(product.name)
  }, [availableProducts])

  const handleAddProduct = useCallback(() => {
    if (!selectedNewProduct) {
      toast.error("Selecciona un producto")
      return
    }

    const parsedQty = Number.parseFloat(newQuantity.replace(",", "."))
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      toast.error("Cantidad invalida")
      return
    }

    const unitMeasurementId = Number.parseInt(newSelectedUnitId, 10)
    if (!Number.isFinite(unitMeasurementId)) {
      toast.error("Selecciona una unidad")
      return
    }

    onAddItem(selectedNewProduct, unitMeasurementId, parsedQty)
    setProductSearch("")
    setNewProductId(null)
    setNewSelectedUnitId("")
    setNewQuantity("1")
  }, [newQuantity, newSelectedUnitId, onAddItem, selectedNewProduct])

  const handleSubmit = async () => {
    if (!selectedAreaId) {
      toast.error("Por favor selecciona un área")
      return
    }

    if (cart.length === 0) {
      toast.error("El carrito está vacío")
      return
    }

     try {
      setIsSubmitting(true)

      // Final guard: don't allow creating a second order for the same area/day
      const check = await orderService.check({ areaId: selectedAreaId, date: todayDate })
      if (check.exists) {
        const blockedId = Number(selectedAreaId)
        if (Number.isFinite(blockedId)) {
          const nextBlocked = new Set(blockedAreaIds)
          nextBlocked.add(blockedId)
          setBlockedAreaIds((prev) => {
            const next = new Set(prev)
            next.add(blockedId)
            return next
          })
          const firstAvailable = areas.find((area) => area.id !== blockedId && !nextBlocked.has(area.id))
          if (firstAvailable) {
            setSelectedAreaId(firstAvailable.id.toString())
          }
        }
        toast.error("Ya existe un pedido para esta area hoy. No se puede crear otro.")
        return
      }

      // Get current user to obtain userId
      const currentUser = await usersService.getMe()
      if (!currentUser || !currentUser.id) {
        toast.error("No se pudo obtener la información del usuario")
        return
      }
      
      const orderItems = cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        unitMeasurementId: item.selectedUnitId,
      }))

      const orderData: CreateOrderDto = {
        userId: currentUser.id,
        areaId: parseInt(selectedAreaId, 10),
        totalAmount: totalPrice,
        status: "created",
        observation: observation || undefined,
        orderItems,
      }

      console.log("[v0] Creando orden con datos:", orderData)

      await createOrderMutation.mutateAsync(orderData)
      
      toast.success("✓ Orden creada exitosamente")
      setBlockedAreaIds((prev) => {
        const next = new Set(prev)
        const asNumber = Number(selectedAreaId)
        if (Number.isFinite(asNumber)) next.add(asNumber)
        return next
      })
      onClearCart()
      setObservation("")
      onClose()
    } catch (error) {
      console.error("[v0] Error creando orden:", error)
      toast.error("Error al crear la orden")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 rounded-xl">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Carrito ({cart.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 space-y-2 rounded-lg border border-gray-200 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Agregar producto</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={productSearch}
                onChange={(event) => {
                  setProductSearch(event.target.value)
                  if (!event.target.value.trim()) {
                    setNewProductId(null)
                    setNewSelectedUnitId("")
                  }
                }}
                placeholder="Buscar por nombre"
                className="pl-9"
              />
            </div>
            {productSearch.trim().length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectNewProduct(product.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="truncate">{product.name}</span>
                      <Plus className="h-4 w-4 text-green-600" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                )}
              </div>
            )}

            {selectedNewProduct && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select value={newSelectedUnitId} onValueChange={setNewSelectedUnitId}>
                  <SelectTrigger className="sm:col-span-2">
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedNewProduct.productUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.unitMeasurement.id.toString()}>
                        {unit.unitMeasurement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={QUANTITY_LIMITS.MIN}
                  step={QUANTITY_LIMITS.STEP}
                  value={newQuantity}
                  onChange={(event) => setNewQuantity(event.target.value)}
                  className="text-center"
                />
                <Button type="button" onClick={handleAddProduct} className="sm:col-span-3">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar al carrito
                </Button>
              </div>
            )}
          </div>

          {cart.length > 0 ? (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li key={item.cartItemId || `${item.id}-${item.selectedUnitId}`} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => onRemoveItem(item.id, item.selectedUnitId, item.cartItemId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Select
                      value={item.selectedUnitId.toString()}
                      onValueChange={(value) => onChangeItemUnit(item, Number.parseInt(value, 10))}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {item.productUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.unitMeasurement.id.toString()}>
                            {unit.unitMeasurement.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(
                          item.id,
                          item.selectedUnitId,
                          Math.max(QUANTITY_LIMITS.MIN, item.quantity - QUANTITY_LIMITS.STEP),
                          item.cartItemId,
                        )
                      }
                      disabled={item.quantity <= QUANTITY_LIMITS.MIN}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-24 text-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={quantityInputs[getCartItemKey(item)] ?? formatQuantity(item.quantity)}
                        onFocus={() => setEditingQuantityKey(getCartItemKey(item))}
                        onChange={(event) => handleQuantityInputChange(item, event.target.value)}
                        onBlur={() => handleQuantityInputBlur(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur()
                          }
                        }}
                        className="h-8 text-center text-sm font-semibold"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-transparent"
                      onClick={() =>
                        onUpdateQuantity(
                          item.id,
                          item.selectedUnitId,
                          Math.min(QUANTITY_LIMITS.MAX, item.quantity + QUANTITY_LIMITS.STEP),
                          item.cartItemId,
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center text-gray-600">
              <ShoppingCart className="mb-2 h-10 w-10 opacity-20" />
              <p>No hay productos</p>
            </div>
          )}
        </div>

        <div className="border-t p-6 space-y-4">
          {cart.length > 0 && (
            <>
              {/* Seleccionar Área */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Área de entrega *</label>
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId} disabled={isLoadingAreas || isCheckingAreas}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAreas ? (
                      <div className="p-2 text-center text-sm text-gray-500">Cargando áreas...</div>
                    ) : areas.length > 0 ? (
                      areas.map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()} disabled={blockedAreaIds.has(area.id)}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: area.color }}
                            />
                            <span className="truncate">
                              {area.name}
                              {blockedAreaIds.has(area.id) ? " (Bloqueado: ya se hizo un pedido de esta area)" : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">No hay áreas disponibles</div>
                    )}
                  </SelectContent>
                </Select>
                {selectedAreaId && blockedAreaIds.has(Number(selectedAreaId)) && (
                  <p className="text-xs text-red-600">Bloqueado: ya se hizo un pedido de esta area.</p>
                )}
                {allAreasBlocked && (
                  <p className="text-xs text-red-600">Todas tus areas estan bloqueadas hoy por pedidos existentes.</p>
                )}
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Observaciones</label>
                <Textarea
                  placeholder="Agrega notas especiales para tu orden..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="h-20 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Button variant="outline" onClick={onClearCart}>
                  Vaciar
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={isPrinting || isLoadingAreas}>
                  {isPrinting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={isDownloading || isLoadingAreas}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </>
                  )}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !selectedAreaId ||
                    blockedAreaIds.has(Number(selectedAreaId)) ||
                    isLoadingAreas ||
                    isCheckingAreas ||
                    allAreasBlocked
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Confirmar Orden"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


