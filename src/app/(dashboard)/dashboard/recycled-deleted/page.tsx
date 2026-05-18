'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle, Eye, Loader2, Search, Trash2 } from 'lucide-react'
import { useDeletedOrdersQuery } from '@/lib/api'
import type { DeletedOrder, GetDeletedOrdersParams } from '@/types/order'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusColorMap: Record<string, { bg: string; text: string }> = {
  created: { bg: 'bg-blue-100', text: 'text-blue-800' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  process: { bg: 'bg-purple-100', text: 'text-purple-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

const statusLabels: Record<string, string> = {
  created: 'Creada',
  pending: 'Pendiente',
  process: 'En proceso',
  confirmed: 'Confirmada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const sortOptions: Array<{ label: string; value: NonNullable<GetDeletedOrdersParams['sortBy']> }> = [
  { label: 'Eliminado', value: 'deletedAt' },
  { label: 'Pedido original', value: 'originalOrderId' },
  { label: 'Monto', value: 'totalAmount' },
  { label: 'Estado', value: 'status' },
  { label: 'Creado original', value: 'originalCreatedAt' },
]

export default function RecycledDeletedPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortBy, setSortBy] = useState<NonNullable<GetDeletedOrdersParams['sortBy']>>('deletedAt')
  const [order, setOrder] = useState<NonNullable<GetDeletedOrdersParams['order']>>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [q, setQ] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<DeletedOrder | null>(null)

  const { data, isLoading, error } = useDeletedOrdersQuery({
    page,
    limit,
    sortBy,
    order,
    q: q.trim() || undefined,
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString

    const dateStr = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    return `${dateStr} ${timeStr}`
  }

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0))

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setQ(searchTerm)
  }

  const orders = data?.items ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages || 1
  const currentStart = totalItems === 0 ? 0 : (page - 1) * limit + 1
  const currentEnd = Math.min(page * limit, totalItems)
  const totalProducts = orders.reduce((total, item) => total + (item.deletedOrderItems?.length ?? 0), 0)

  return (
    <div className='h-full w-full flex flex-col bg-background overflow-hidden'>
      <header className='flex h-16 shrink-0 items-center gap-2 bg-white border-b border-border'>
        <div className='flex items-center gap-2 px-6'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href='/dashboard'>Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reciclado / Eliminados</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='h-full flex flex-col p-6 overflow-y-auto'>
        <div className='mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Pedidos eliminados</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Revisa pedidos eliminados por equivocacion y sus productos originales.
            </p>
          </div>

          <form onSubmit={handleSearch} className='flex w-full flex-col gap-2 sm:flex-row lg:w-auto'>
            <div className='relative min-w-0 sm:w-72'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder='Buscar pedido, area o cliente'
                className='pl-9'
              />
            </div>
            <select
              value={sortBy}
              onChange={(event) => {
                setPage(1)
                setSortBy(event.target.value as NonNullable<GetDeletedOrdersParams['sortBy']>)
              }}
              className='h-10 rounded-md border border-input bg-background px-3 text-sm'
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setPage(1)
                setOrder((current) => (current === 'desc' ? 'asc' : 'desc'))
              }}
            >
              {order === 'desc' ? 'Desc' : 'Asc'}
            </Button>
            <Button type='submit'>Buscar</Button>
          </form>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6'>
          <Card className='border-l-4 border-l-red-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Eliminados
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>{totalItems}</div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>pedidos en reciclado</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-blue-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                En esta pagina
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>{orders.length}</div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>registros visibles</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-emerald-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>{totalProducts}</div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>items visibles</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-slate-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Paginas
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>{totalPages}</div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>resultados paginados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Trash2 className='h-4 w-4 text-red-600' />
              Listado de pedidos eliminados
            </CardTitle>
            <CardDescription className='text-xs'>
              {totalItems} pedidos en total ({page} de {totalPages} paginas)
            </CardDescription>
          </CardHeader>

          <CardContent className='px-4'>
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3'>
                <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='font-semibold text-red-900'>Error al cargar pedidos eliminados</p>
                  <p className='text-red-700 text-sm'>{error instanceof Error ? error.message : 'Intenta de nuevo'}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-2'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                  <p className='text-muted-foreground'>Cargando pedidos eliminados...</p>
                </div>
              </div>
            ) : orders.length > 0 ? (
              <>
                <div className='space-y-3 lg:hidden'>
                  {orders.map((deletedOrder) => (
                    <Card key={deletedOrder.id} className='border border-border'>
                      <CardContent className='p-4 space-y-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='text-xs text-muted-foreground'>Pedido original</p>
                            <p className='font-semibold text-primary text-sm'>#{deletedOrder.originalOrderId}</p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                              statusColorMap[deletedOrder.status]?.bg || 'bg-gray-100'
                            } ${statusColorMap[deletedOrder.status]?.text || 'text-gray-800'}`}
                          >
                            {statusLabels[deletedOrder.status] || deletedOrder.status}
                          </div>
                        </div>

                        <div className='grid grid-cols-1 gap-2 text-xs'>
                          <div>
                            <p className='text-muted-foreground'>Eliminado</p>
                            <p>{formatDate(deletedOrder.deletedAt)}</p>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Area</p>
                            <div
                              className='mt-1 px-2 py-1 rounded-full text-xs font-semibold text-white w-fit'
                              style={{ backgroundColor: deletedOrder.area?.color || '#666' }}
                            >
                              {deletedOrder.area?.name || `Area ${deletedOrder.areaId}`}
                            </div>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Productos</p>
                            <p className='font-medium'>{deletedOrder.deletedOrderItems?.length || 0}</p>
                            {(deletedOrder.deletedOrderItems?.length ?? 0) > 0 && (
                              <p className='text-muted-foreground line-clamp-2'>
                                {deletedOrder.deletedOrderItems
                                  ?.map((item) => `${item.quantity} ${item.product?.name || `Producto ${item.productId}`}`)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Total</p>
                            <p className='font-semibold'>{formatCurrency(deletedOrder.totalAmount)}</p>
                          </div>
                        </div>

                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 w-full text-xs'
                          onClick={() => setSelectedOrder(deletedOrder)}
                        >
                          <Eye className='w-3.5 h-3.5 mr-1' />
                          Ver productos
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className='relative overflow-x-auto hidden lg:block'>
                  <Table className='w-full table-fixed text-sm'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[170px] text-xs px-2'>Eliminado</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Pedido</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Area</TableHead>
                        <TableHead className='w-[260px] text-xs px-2'>Productos</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Estado</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Total</TableHead>
                        <TableHead className='sticky right-0 z-10 w-[88px] bg-background text-right text-xs px-2 border-l border-border'>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((deletedOrder) => (
                        <TableRow key={deletedOrder.id} className='group hover:bg-muted/50'>
                          <TableCell className='text-xs text-muted-foreground whitespace-nowrap px-2'>
                            {formatDate(deletedOrder.deletedAt)}
                          </TableCell>
                          <TableCell className='font-semibold text-primary text-xs px-2'>
                            #{deletedOrder.originalOrderId}
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className='px-2 py-1 rounded-full text-xs font-semibold text-white w-fit'
                              style={{ backgroundColor: deletedOrder.area?.color || '#666' }}
                            >
                              {deletedOrder.area?.name || `Area ${deletedOrder.areaId}`}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div className='text-xs min-w-0'>
                              <p className='font-medium'>{deletedOrder.deletedOrderItems?.length || 0}</p>
                              {(deletedOrder.deletedOrderItems?.length ?? 0) > 0 && (
                                <p className='text-xs text-muted-foreground truncate'>
                                  {deletedOrder.deletedOrderItems
                                    ?.map((item) => `${item.quantity} ${item.product?.name || `Producto ${item.productId}`}`)
                                    .join(', ')}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                statusColorMap[deletedOrder.status]?.bg || 'bg-gray-100'
                              } ${statusColorMap[deletedOrder.status]?.text || 'text-gray-800'}`}
                            >
                              {statusLabels[deletedOrder.status] || deletedOrder.status}
                            </div>
                          </TableCell>
                          <TableCell className='px-2 text-xs font-medium'>
                            {formatCurrency(deletedOrder.totalAmount)}
                          </TableCell>
                          <TableCell className='sticky right-0 bg-background group-hover:bg-muted/50 text-right px-2 border-l border-border'>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0'
                              title='Ver productos'
                              aria-label='Ver productos'
                              onClick={() => setSelectedOrder(deletedOrder)}
                            >
                              <Eye className='w-3.5 h-3.5' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-3'>
                  <div className='text-xs text-muted-foreground'>
                    Mostrando {currentStart} a {currentEnd} de {totalItems} pedidos eliminados
                  </div>
                  <div className='flex gap-2 items-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                      disabled={!data?.hasPrevPage}
                      className='h-8 text-xs'
                    >
                      Anterior
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      <span className='text-xs font-medium'>
                        Pag {page} de {totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                      disabled={!data?.hasNextPage}
                      className='h-8 text-xs'
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <p className='text-muted-foreground text-lg'>No hay pedidos eliminados</p>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Cuando elimines un pedido por equivocacion aparecera aqui.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Pedido eliminado #{selectedOrder?.originalOrderId}</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Eliminado: ${formatDate(selectedOrder.deletedAt)} - Original: ${formatDate(selectedOrder.originalCreatedAt)}`
                : 'Sin pedido seleccionado'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-4 text-sm'>
                <div>
                  <p className='text-muted-foreground'>Estado</p>
                  <p className='font-medium'>{statusLabels[selectedOrder.status] || selectedOrder.status}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Area</p>
                  <p className='font-medium'>{selectedOrder.area?.name || `Area ${selectedOrder.areaId}`}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Productos</p>
                  <p className='font-medium'>{selectedOrder.deletedOrderItems?.length || 0}</p>
                </div>
                <div>
                  <p className='text-muted-foreground'>Total</p>
                  <p className='font-medium'>{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              <div className='max-h-64 overflow-auto rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrder.deletedOrderItems || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || `Producto ${item.productId}`}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitMeasurement?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <p className='text-sm text-muted-foreground'>Observacion</p>
                <p className='text-sm font-medium'>
                  {selectedOrder.observation?.trim() ? selectedOrder.observation : 'Sin observacion'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
