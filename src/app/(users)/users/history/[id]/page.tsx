"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, Loader2, Trash2, Printer, Download, Minus, Plus } from "lucide-react"
import {
  useDeleteOrderMutation,
  useOrderQuery,
  useUpdateOrderMutation,
  useProductsQuery,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { OrderItem } from "@/types/order"
import { toast } from "sonner"

const PERU_TIME_ZONE = "America/Lima"
const peruDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PERU_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const peruDateTimeFormatter = new Intl.DateTimeFormat("es-PE", {
  timeZone: PERU_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})
const ALLOWED_REMOTE_IMAGE_HOSTS = new Set(["res.cloudinary.com"])
const IMAGE_PLACEHOLDER = "/placeholder.svg"

function getPeruDateKey(dateValue?: string) {
  if (!dateValue) return null

  const peruLocalMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/)
  if (peruLocalMatch) {
    const [, year, month, day] = peruLocalMatch
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return null
  return peruDateKeyFormatter.format(parsed)
}

function formatDate(dateValue?: string) {
  if (!dateValue) return "Sin fecha"

  const peruLocalMatch = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (peruLocalMatch) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = peruLocalMatch
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return "Sin fecha"
  return peruDateTimeFormatter.format(parsed)
}

function isToday(dateValue: string | undefined, todayKey: string | null) {
  if (!todayKey) return false
  const orderDateKey = getPeruDateKey(dateValue)
  if (!orderDateKey) return false
  return orderDateKey === todayKey
}

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

function formatQuantity(value: number) {
  if (!Number.isFinite(value)) return "0"
  if (value % 1 === 0) return value.toFixed(0)
  return value.toFixed(3).replace(/\.?0+$/, "")
}

function getItemLabel(item: OrderItem) {
  const unitName = item.unitMeasurement?.name ?? "Unidad"
  return `${formatQuantity(item.quantity)} ${unitName}`
}

interface AddedOrderItemDraft {
  tempId: string
  productId: number
  productName: string
  imageUrl?: string
  unitMeasurementId: number
  unitName: string
  quantity: string
  price: number
}

export default function OrderHistoryDetailPage() {
  const [draftObservation, setDraftObservation] = useState("")
  const [draftObservationTouched, setDraftObservationTouched] = useState(false)
  const [draftQuantities, setDraftQuantities] = useState<Record<number, string>>({})
  const [removedExistingItemIds, setRemovedExistingItemIds] = useState<number[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [addedItems, setAddedItems] = useState<AddedOrderItemDraft[]>([])
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeletingOrder, setIsDeletingOrder] = useState(false)
  const [isClearingOrder, setIsClearingOrder] = useState(false)
  const params = useParams()
  const router = useRouter()
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const todayPeruDateKey = useMemo(
    () => (isHydrated ? peruDateKeyFormatter.format(new Date()) : null),
    [isHydrated]
  )
  const orderId = useMemo(() => {
    const raw = params?.id
    const value = Array.isArray(raw) ? raw[0] : raw
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }, [params?.id])

  const { data: order, isLoading: isOrderLoading, error: orderError } = useOrderQuery(orderId)
  const updateOrderMutation = useUpdateOrderMutation(orderId ?? 0)
  const deleteOrderMutation = useDeleteOrderMutation()
  const { data: productsResponse } = useProductsQuery({ page: 1, limit: 500, order: "asc", sortBy: "name" })
  const productNameById = useMemo(() => {
    const map = new Map<number, string>()
    const items = productsResponse?.items ?? []
    for (const product of items) {
      map.set(product.id, product.name)
    }
    return map
  }, [productsResponse?.items])
  const productImageById = useMemo(() => {
    const map = new Map<number, string>()
    const items = productsResponse?.items ?? []
    for (const product of items) {
      if (product.imageUrl) {
        map.set(product.id, product.imageUrl)
      }
    }
    return map
  }, [productsResponse?.items])

  const canEdit = useMemo(() => {
    return isToday(order?.createdAt, todayPeruDateKey)
  }, [order?.createdAt, todayPeruDateKey])

  const productUnitOptions = useMemo(() => {
    const items = productsResponse?.items ?? []
    return items.flatMap((product) =>
      (product.productUnits ?? []).map((unit) => ({
        key: `${product.id}__${unit.id}`,
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        unitMeasurementId: unit.unitMeasurementId,
        unitName: unit.unitMeasurement?.name ?? "Unidad",
        price: product.price ?? 0,
      }))
    )
  }, [productsResponse?.items])

  const filteredProductUnitOptions = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    if (!term) return []
    return productUnitOptions.filter((option) =>
      `${option.productName} ${option.unitName}`.toLowerCase().includes(term)
    )
  }, [productSearch, productUnitOptions])

  const handleAddProduct = useCallback((selectedKey: string) => {
    const selected = productUnitOptions.find((option) => option.key === selectedKey)
    if (!selected) return

    const step = 0.25

    setAddedItems((prev) => [
      ...prev,
      {
        tempId: `${selected.productId}-${selected.unitMeasurementId}-${Date.now()}`,
        productId: selected.productId,
        productName: selected.productName,
        imageUrl: selected.imageUrl,
        unitMeasurementId: selected.unitMeasurementId,
        unitName: selected.unitName,
        quantity: String(step),
        price: selected.price,
      },
    ])
    setProductSearch("")
  }, [productUnitOptions])

  const adjustExistingQuantity = useCallback((itemId: number, fallback: number, delta: number) => {
    setDraftQuantities((prev) => {
      const current = Number.parseFloat((prev[itemId] ?? String(fallback)).replace(",", "."))
      const base = Number.isFinite(current) ? current : fallback
      const next = Math.max(0.25, Math.round((base + delta) * 100) / 100)
      return { ...prev, [itemId]: String(next) }
    })
  }, [])

  const adjustAddedQuantity = useCallback((tempId: string, fallback: string, delta: number) => {
    setAddedItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item
        const current = Number.parseFloat((item.quantity || fallback).replace(",", "."))
        const base = Number.isFinite(current) ? current : Number.parseFloat(fallback) || 0.25
        const next = Math.max(0.25, Math.round((base + delta) * 100) / 100)
        return { ...item, quantity: String(next) }
      })
    )
  }, [])

  const visibleExistingItems = useMemo(() => {
    return (order?.orderItems || []).filter((item) => !removedExistingItemIds.includes(item.id))
  }, [order?.orderItems, removedExistingItemIds])

  const handleRemoveExistingItem = useCallback((itemId: number) => {
    setRemovedExistingItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
    setDraftQuantities((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!order || !orderId) return

    const normalizedItems = (order.orderItems || [])
      .filter((item) => !removedExistingItemIds.includes(item.id))
      .map((item) => {
        const parsed = Number.parseFloat((draftQuantities[item.id] ?? `${item.quantity}`).replace(",", "."))
        return {
          ...item,
          quantity: Number.isFinite(parsed) ? parsed : item.quantity,
        }
      })

    const normalizedAddedItems = addedItems.map((item) => {
      const parsed = Number.parseFloat(item.quantity.replace(",", "."))
      return {
        ...item,
        quantity: Number.isFinite(parsed) ? parsed : 0,
      }
    })

    const hasInvalidQuantity =
      normalizedItems.some((item) => item.quantity <= 0) ||
      normalizedAddedItems.some((item) => item.quantity <= 0)
    if (hasInvalidQuantity) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    const totalAmount =
      normalizedItems.reduce((sum, item) => sum + item.quantity * item.price, 0) +
      normalizedAddedItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

    try {
      await updateOrderMutation.mutateAsync({
        areaId: order.areaId,
        userId: order.userId,
        status: order.status,
        observation: draftObservationTouched ? (draftObservation.trim() || undefined) : (order.observation?.trim() || undefined),
        totalAmount,
        orderItems: [
          ...normalizedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            unitMeasurementId: item.unitMeasurementId,
          })),
          ...normalizedAddedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            unitMeasurementId: item.unitMeasurementId,
          })),
        ],
      })
      setDraftQuantities({})
      setRemovedExistingItemIds([])
      setAddedItems([])
      setDraftObservationTouched(false)
      toast.success("Pedido actualizado")
      router.push("/users/history")
    } catch (error) {
      console.error("[OrderHistoryDetailPage] Error updating order:", error)
      toast.error("No se pudo actualizar el pedido")
    }
  }, [addedItems, draftObservation, draftObservationTouched, draftQuantities, order, orderId, removedExistingItemIds, router, updateOrderMutation])

  const buildPrintPayload = useCallback(() => {
    if (!order) return null

    const normalizedItems = (order.orderItems || [])
      .filter((item) => !removedExistingItemIds.includes(item.id))
      .map((item) => {
        const parsed = Number.parseFloat((draftQuantities[item.id] ?? `${item.quantity}`).replace(",", "."))
        return {
          productName:
            item.product?.name || productNameById.get(item.productId) || `Producto #${item.productId}`,
          quantity: Number.isFinite(parsed) ? parsed : item.quantity,
          unitName: item.unitMeasurement?.name ?? "Unidad",
        }
      })

    const normalizedAddedItems = addedItems.map((item) => {
      const parsed = Number.parseFloat(item.quantity.replace(",", "."))
      return {
        productName: item.productName,
        quantity: Number.isFinite(parsed) ? parsed : 0,
        unitName: item.unitName,
      }
    })

    const mergedItems = [...normalizedItems, ...normalizedAddedItems].filter((item) => item.quantity > 0)
    if (mergedItems.length === 0) return null

    return {
      areaName: order.area?.name || `Area #${order.areaId}`,
      observation: draftObservationTouched ? draftObservation : order.observation || "",
      items: mergedItems,
    }
  }, [addedItems, draftObservation, draftObservationTouched, draftQuantities, order, productNameById, removedExistingItemIds])

  const handlePrintPdf = useCallback(async () => {
    const payload = buildPrintPayload()
    if (!payload) {
      toast.error("No hay productos para imprimir")
      return
    }

    try {
      setIsPrinting(true)
      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("No se pudo generar PDF")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, "_blank", "noopener,noreferrer")
      if (!win) {
        const link = document.createElement("a")
        link.href = url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (error) {
      console.error("[OrderHistoryDetailPage] Error printing PDF:", error)
      toast.error("No se pudo imprimir")
    } finally {
      setIsPrinting(false)
    }
  }, [buildPrintPayload])

  const handleDownloadPdf = useCallback(async () => {
    const payload = buildPrintPayload()
    if (!payload) {
      toast.error("No hay productos para descargar")
      return
    }

    try {
      setIsDownloading(true)
      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("No se pudo generar PDF")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-${order?.id ?? "detalle"}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (error) {
      console.error("[OrderHistoryDetailPage] Error downloading PDF:", error)
      toast.error("No se pudo descargar")
    } finally {
      setIsDownloading(false)
    }
  }, [buildPrintPayload, order?.id])

  const handleClearOrder = useCallback(async () => {
    if (!order || !orderId) return
    if (!window.confirm(`¿Vaciar los productos del pedido #${order.id}?`)) return

    try {
      setIsClearingOrder(true)
      await updateOrderMutation.mutateAsync({
        observation: draftObservationTouched ? (draftObservation.trim() || undefined) : (order.observation?.trim() || undefined),
        totalAmount: 0,
        orderItems: [],
      })
      setDraftQuantities({})
      setRemovedExistingItemIds([])
      setAddedItems([])
      toast.success("Pedido vaciado")
    } catch (error) {
      console.error("[OrderHistoryDetailPage] Error clearing order:", error)
      toast.error("No se pudo vaciar el pedido")
    } finally {
      setIsClearingOrder(false)
    }
  }, [draftObservation, draftObservationTouched, order, orderId, updateOrderMutation])

  const handleDeleteOrder = useCallback(async () => {
    if (!order) return
    if (!window.confirm(`¿Eliminar el pedido #${order.id}? Esta accion no se puede deshacer.`)) return

    try {
      setIsDeletingOrder(true)
      await deleteOrderMutation.mutateAsync(order.id)
      toast.success("Pedido eliminado")
      router.push("/users/history")
    } catch (error) {
      console.error("[OrderHistoryDetailPage] Error deleting order:", error)
      toast.error("No se pudo eliminar el pedido")
    } finally {
      setIsDeletingOrder(false)
    }
  }, [deleteOrderMutation, order, router])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Link href="/users/history">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Historial</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Pedido {order?.id ? `#${order.id}` : ""}
              </h1>
              <p className="text-sm text-gray-500">Detalles y edicion del pedido.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {isOrderLoading ? (
          <div className="text-sm text-gray-500">Cargando pedido...</div>
        ) : orderError || !order ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              No se pudo cargar el pedido solicitado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-gray-900">Pedido #{order.id}</CardTitle>
                    <p className="text-xs text-gray-500">Creado: {formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    {order.status || "pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Area: {order.area?.name || `Area #${order.areaId}`}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                {canEdit && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-blue-900">Agregar producto</p>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        className="h-9 bg-white"
                        placeholder="Buscar producto o unidad"
                      />
                      <div className="max-h-44 overflow-y-auto rounded-md border border-blue-100 bg-white">
                        {productSearch.trim().length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-500">Escribe para buscar productos</p>
                        ) : filteredProductUnitOptions.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-gray-500">Sin resultados</p>
                        ) : (
                          filteredProductUnitOptions.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleAddProduct(option.key)}
                              className="flex w-full items-center justify-between border-b border-blue-50 px-3 py-2 text-left text-sm hover:bg-blue-50 last:border-b-0"
                            >
                              <span>{option.productName} - {option.unitName}</span>
                              <span className="text-xs font-semibold text-blue-700">Agregar</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {visibleExistingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white">
                          <Image
                            src={getSafeImageSrc(item.product?.imageUrl || productImageById.get(item.productId))}
                            alt={item.product?.name || `Producto ${item.productId}`}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name ||
                              productNameById.get(item.productId) ||
                              `Producto #${item.productId}`}
                          </p>
                          {canEdit ? (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-500">Cantidad:</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  adjustExistingQuantity(
                                    item.id,
                                    Number.parseFloat((draftQuantities[item.id] ?? String(item.quantity)).replace(",", ".")),
                                    -0.25
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.25"
                                value={draftQuantities[item.id] ?? String(item.quantity)}
                                onChange={(event) =>
                                  setDraftQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: event.target.value,
                                  }))
                                }
                                className="h-8 w-20 text-sm sm:w-28"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  adjustExistingQuantity(
                                    item.id,
                                    Number.parseFloat((draftQuantities[item.id] ?? String(item.quantity)).replace(",", ".")),
                                    0.25
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-500">{item.unitMeasurement?.name ?? "Unidad"}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">Cantidad: {getItemLabel(item)}</p>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExistingItem(item.id)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label="Quitar producto"
                          title="Quitar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {visibleExistingItems.length === 0 && addedItems.length === 0 && (
                    <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                  )}
                  {canEdit &&
                    addedItems.map((item) => (
                      <div
                        key={item.tempId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-white">
                            <Image
                              src={getSafeImageSrc(item.imageUrl)}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-gray-500">Cantidad:</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => adjustAddedQuantity(item.tempId, item.quantity, -0.25)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.25"
                                value={item.quantity}
                                onChange={(event) =>
                                  setAddedItems((prev) =>
                                    prev.map((current) =>
                                      current.tempId === item.tempId
                                        ? { ...current, quantity: event.target.value }
                                        : current
                                    )
                                  )
                                }
                                className="h-8 w-20 text-sm sm:w-28"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => adjustAddedQuantity(item.tempId, item.quantity, 0.25)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-500">{item.unitName}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setAddedItems((prev) => prev.filter((current) => current.tempId !== item.tempId))
                          }
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label="Quitar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-semibold text-gray-500">Observacion</p>
                  {canEdit ? (
                    <textarea
                      value={draftObservationTouched ? draftObservation : (order.observation || "")}
                      onChange={(event) => {
                        setDraftObservationTouched(true)
                        setDraftObservation(event.target.value)
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Observaciones del pedido"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{order.observation || "Sin observaciones"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Edicion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isHydrated ? (
                  <p className="text-sm text-gray-500">Cargando...</p>
                ) : !order?.createdAt ? (
                  <p className="text-sm text-red-700">
                    No se puede determinar la fecha del pedido.
                  </p>
                ) : !canEdit ? (
                  <p className="text-sm text-red-700">
                    Solo se pueden editar pedidos del día actual.
                  </p>
                ) : (
                  <p className="text-sm text-green-700">
                    ✅ Este pedido puede ser editado.
                  </p>
                )}
                {canEdit ? (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => void handleSaveEdit()}
                      disabled={updateOrderMutation.isPending}
                    >
                      {updateOrderMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" onClick={() => void handlePrintPdf()} disabled={isPrinting}>
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                        Imprimir
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void handleDownloadPdf()} disabled={isDownloading}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        onClick={() => void handleClearOrder()}
                        disabled={isClearingOrder || updateOrderMutation.isPending}
                      >
                        {isClearingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Vaciar pedido
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button disabled className="w-full">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                      Edición no disponible
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => void handleDeleteOrder()}
                  disabled={isDeletingOrder || deleteOrderMutation.isPending}
                >
                  {isDeletingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar pedido
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
