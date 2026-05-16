"use client"

import { Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, RefreshCw, Loader2, Download, Trash2, FileText } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDeleteOrderMutation, useMeQuery, useOrdersByCustomerQuery, useProductsQuery } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Order, OrderItem } from "@/types/order"
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

  // Backend often returns "YYYY-MM-DD HH:mm:ss" already in Peru local time.
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

  // Backend often returns "YYYY-MM-DD HH:mm:ss" already in Peru local time.
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

function UsersHistoryPageContent() {
  const [downloadingOrderId, setDownloadingOrderId] = useState<number | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null)
  const [isClearingOrders, setIsClearingOrders] = useState(false)
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null)
  const [autoOpenedOrderId, setAutoOpenedOrderId] = useState<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const { data: currentUser, isLoading: isUserLoading, error: userError } = useMeQuery()
  const deleteOrderMutation = useDeleteOrderMutation()
  const userId = currentUser?.id ?? null
  const showLoadingUser = !isHydrated || isUserLoading
  const todayPeruDateKey = useMemo(
    () => (isHydrated ? peruDateKeyFormatter.format(new Date()) : null),
    [isHydrated]
  )

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch,
  } = useOrdersByCustomerQuery(userId, { page: 1, limit: 100, sortBy: "createdAt", order: "desc" })
  const { data: productsResponse } = useProductsQuery({ page: 1, limit: 500, order: "asc", sortBy: "name" })

  const orders = useMemo(() => ordersResponse?.items ?? [], [ordersResponse?.items])
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
  const selectedOrderIdFromQuery = useMemo(() => {
    const raw = searchParams.get("orderId")
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])
  const detailOrder = useMemo(
    () => orders.find((order) => order.id === detailOrderId) ?? null,
    [detailOrderId, orders]
  )

  useEffect(() => {
    if (!selectedOrderIdFromQuery) {
      setAutoOpenedOrderId(null)
      return
    }
    if (autoOpenedOrderId === selectedOrderIdFromQuery) return
    const targetOrder = orders.find((order) => order.id === selectedOrderIdFromQuery)
    if (!targetOrder) return
    setDetailOrderId(targetOrder.id)
    setAutoOpenedOrderId(targetOrder.id)
  }, [autoOpenedOrderId, orders, selectedOrderIdFromQuery])

  const closeDetailDialog = useCallback(() => {
    setDetailOrderId(null)
    if (selectedOrderIdFromQuery) {
      router.replace(pathname, { scroll: false })
    }
  }, [pathname, router, selectedOrderIdFromQuery])

  const handleDownloadOrder = useCallback(async (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error("No hay productos para descargar en este pedido")
      return
    }

    try {
      setDownloadingOrderId(order.id)
      const payload = {
        areaName: order.area?.name || `Area #${order.areaId}`,
        createdAt: order.createdAt,
        observation: order.observation?.trim() || "",
        items: (order.orderItems || []).map((item) => ({
          productName:
            item.product?.name ||
            productNameById.get(item.productId) ||
            `Producto #${item.productId}`,
          quantity: item.quantity,
          unitName: item.unitMeasurement?.name || "Unidad",
        })),
      }

      const response = await fetch("/api/orders/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let backendMessage = "No se pudo generar PDF"
        try {
          const errorBody = await response.json()
          if (typeof errorBody?.message === "string" && errorBody.message.trim()) {
            backendMessage = errorBody.message
          }
        } catch {
          // ignore json parse errors
        }
        throw new Error(backendMessage)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pedido-${order.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      toast.success("Descarga lista")
    } catch (error) {
      console.error("[UsersHistoryPage] Error downloading order:", error)
      const message = error instanceof Error ? error.message : "Error al descargar PDF"
      toast.error(message)
    } finally {
      setDownloadingOrderId(null)
    }
  }, [productNameById])

  const handleDeleteOrder = useCallback(async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido #${order.id}?`)) return

    try {
      setDeletingOrderId(order.id)
      await deleteOrderMutation.mutateAsync(order.id)
      await refetch()
      toast.success("Pedido eliminado")
    } catch (error) {
      console.error("[UsersHistoryPage] Error deleting order:", error)
      toast.error("No se pudo eliminar el pedido")
    } finally {
      setDeletingOrderId(null)
    }
  }, [deleteOrderMutation, refetch])

  const handleClearAllOrders = useCallback(async () => {
    if (orders.length === 0) {
      toast.error("No hay pedidos para vaciar")
      return
    }

    if (!window.confirm(`¿Vaciar ${orders.length} pedido(s)? Esta accion no se puede deshacer.`)) return

    try {
      setIsClearingOrders(true)
      for (const order of orders) {
        await deleteOrderMutation.mutateAsync(order.id)
      }
      await refetch()
      toast.success("Pedidos eliminados")
    } catch (error) {
      console.error("[UsersHistoryPage] Error clearing orders:", error)
      toast.error("No se pudieron vaciar todos los pedidos")
    } finally {
      setIsClearingOrders(false)
    }
  }, [deleteOrderMutation, orders, refetch])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Historial</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de pedidos</h1>
              <p className="text-sm text-gray-500">Tus compras recientes y detalles completos.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Pedidos: {orders.length}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-700 hover:text-red-800"
              onClick={() => void handleClearAllOrders()}
              disabled={isClearingOrders || orders.length === 0}
            >
              {isClearingOrders ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Vaciar pedidos
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Pedidos totales</CardTitle>
              <div className="rounded-full bg-green-100 p-2">
                <ShoppingBag className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <p className="text-xs text-gray-500">Incluye todos los pedidos realizados</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Ultimo pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {orders[0]?.id ? `#${orders[0].id}` : "Sin datos"}
              </div>
              <p className="text-xs text-gray-500">{formatDate(orders[0]?.createdAt)}</p>
            </CardContent>
          </Card>
        </div>

        {showLoadingUser ? (
          <div className="text-sm text-gray-500">Cargando usuario...</div>
        ) : !userId ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              Necesitas iniciar sesion para ver tu historial.
            </CardContent>
          </Card>
        ) : userError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              No se pudo cargar el usuario autenticado.
            </CardContent>
          </Card>
        ) : ordersError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">
              Ocurrio un error al cargar tu historial.
            </CardContent>
          </Card>
        ) : isOrdersLoading ? (
          <div className="text-sm text-gray-500">Cargando historial...</div>
        ) : orders.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="p-6 text-center text-gray-600">
              Aun no tienes pedidos registrados.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order: Order) => (
              <Card key={order.id} className="border border-gray-200 shadow-sm">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-gray-900">Pedido #{order.id}</CardTitle>
                      <p className="text-xs text-gray-500">Creado: {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="uppercase tracking-wide">
                        {order.status || "pendiente"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Area: {order.area?.name || `Area #${order.areaId}`}
                  </p>
                  {order.observation && (
                    <p className="text-sm text-gray-600">Nota: {order.observation}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    {(order.orderItems || []).map((item) => (
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name ||
                              productNameById.get(item.productId) ||
                              `Producto #${item.productId}`}
                          </p>
                          <p className="text-xs text-gray-500">Cantidad: {getItemLabel(item)}</p>
                        </div>
                      </div>
                    ))}
                    {(order.orderItems || []).length === 0 && (
                      <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailOrderId(order.id)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Detalle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-9 p-0"
                      onClick={() => void handleDeleteOrder(order)}
                      disabled={deletingOrderId === order.id}
                      aria-label="Eliminar pedido"
                      title="Eliminar pedido"
                    >
                      {deletingOrderId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  {isToday(order.createdAt, todayPeruDateKey) && (
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                        <Link href={`/users/history/${order.id}`} className="flex items-center gap-2">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modificar pedido
                        </Link>
                      </Button>
                  )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={detailOrderId !== null} onOpenChange={(open) => !open && closeDetailDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {detailOrder ? `Detalle del pedido #${detailOrder.id}` : "Detalle del pedido"}
            </DialogTitle>
            <DialogDescription>
              Revisa los productos del pedido y descarga su PDF.
            </DialogDescription>
          </DialogHeader>

          {detailOrder ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                <p><span className="font-semibold">Fecha:</span> {formatDate(detailOrder.createdAt)}</p>
                <p><span className="font-semibold">Estado:</span> {detailOrder.status || "pendiente"}</p>
                <p><span className="font-semibold">Area:</span> {detailOrder.area?.name || `Area #${detailOrder.areaId}`}</p>
                <p><span className="font-semibold">Items:</span> {(detailOrder.orderItems || []).length}</p>
              </div>

              {detailOrder.observation && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span className="font-semibold">Nota:</span> {detailOrder.observation}
                </p>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                {(detailOrder.orderItems || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No hay items registrados en esta orden.</p>
                ) : (
                  (detailOrder.orderItems || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <p className="truncate text-gray-800">
                        {item.product?.name ||
                          productNameById.get(item.productId) ||
                          `Producto #${item.productId}`}
                      </p>
                      <p className="shrink-0 font-medium text-gray-700">{getItemLabel(item)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No se encontro la orden seleccionada.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDetailDialog}>
              Cerrar
            </Button>
            {detailOrder && (
              <Button
                onClick={() => void handleDownloadOrder(detailOrder)}
                disabled={downloadingOrderId === detailOrder.id}
                className="gap-2"
              >
                {downloadingOrderId === detailOrder.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function UsersHistoryPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Cargando historial...</div>}>
      <UsersHistoryPageContent />
    </Suspense>
  )
}
