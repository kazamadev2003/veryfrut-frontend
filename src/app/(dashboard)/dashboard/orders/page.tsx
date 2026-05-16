'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDeleteOrderMutation, useOrdersQuery } from '@/lib/api';
import { Order } from '@/types/order';
import { ReportDialog } from './report-dialog';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, Plus, FileDown, Trash2, Eye, Pencil, Download } from 'lucide-react';

const statusColorMap: Record<string, { bg: string; text: string }> = {
  created: { bg: 'bg-blue-100', text: 'text-blue-800' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  process: { bg: 'bg-purple-100', text: 'text-purple-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

const statusLabels: Record<string, string> = {
  created: 'Creada',
  pending: 'Pendiente',
  process: 'En proceso',
  confirmed: 'Confirmada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pagination, setPagination] = useState({ page: 1, limit: 100 });
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDownloadingOrder, setIsDownloadingOrder] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data, isLoading, error } = useOrdersQuery({
    page: pagination.page,
    limit: pagination.limit,
  });
  const deleteMutation = useDeleteOrderMutation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${dateStr} ${timeStr}`;
  };

  const getOrderNumber = (index: number) => {
    const sequence = (pagination.page - 1) * pagination.limit + index + 1;
    return `#PEDODP-${sequence}`;
  };

  const handleNewOrder = () => {
    router.push('/dashboard/orders/new');
  };

  const handleGenerateReport = () => {
    setReportDialogOpen(true);
  };
//esto dejalo asi
  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    router.push(`/dashboard/orders/edit/${order.id}`);
  };

  const handleDelete = async (order: Order) => {
    if (!window.confirm(`Estas seguro de que deseas eliminar la orden #${order.id}?`)) return;

    try {
      setDeletingId(order.id);
      await deleteMutation.mutateAsync(order.id);
    } catch (err) {
      console.error('[OrdersPage] Error deleting order:', err);
      alert('Error al eliminar la orden');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadOrder = async (order: Order) => {
    const items = (order.orderItems ?? []).map((item) => ({
      productName: item.product?.name || `Producto ${item.productId}`,
      quantity: item.quantity,
      unitName: item.unitMeasurement?.name || '',
    }));

    if (items.length === 0) {
      toast.error('La orden no tiene productos para descargar');
      return;
    }

    try {
      setIsDownloadingOrder(true);

      const response = await fetch('/api/orders/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaName: order.area?.name || `Area ${order.areaId}`,
          createdAt: order.createdAt,
          observation: order.observation || '',
          items,
        }),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar la descarga');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedido-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (downloadError) {
      console.error('[OrdersPage] Error downloading order:', downloadError);
      toast.error('Error al descargar la orden');
    } finally {
      setIsDownloadingOrder(false);
    }
  };

  useEffect(() => {
    const openOrderIdParam = searchParams.get('openOrderId');
    if (!openOrderIdParam || !data?.items?.length) return;

    const openOrderId = Number(openOrderIdParam);
    if (!Number.isFinite(openOrderId)) return;

    const foundOrder = data.items.find((order) => order.id === openOrderId);
    if (!foundOrder) return;

    setSelectedOrder(foundOrder);
    setDetailDialogOpen(true);
  }, [data?.items, searchParams]);

  const handleDetailDialogOpenChange = (open: boolean) => {
    setDetailDialogOpen(open);
    if (!open) {
      setSelectedOrder(null);
      if (searchParams.get('openOrderId')) {
        router.replace('/dashboard/orders');
      }
    }
  };

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
                <BreadcrumbPage>Ordenes</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className='h-full flex flex-col p-6 overflow-y-auto'>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Ordenes</h1>
            <p className='text-sm text-muted-foreground mt-1'>Gestiona y visualiza todas tus ordenes</p>
          </div>
          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3'>
            <Button onClick={handleGenerateReport} variant='outline' className='gap-2 w-full sm:w-auto'>
              <FileDown className='w-4 h-4' />
              Generar reporte
            </Button>
            <Button onClick={handleNewOrder} className='gap-2 w-full sm:w-auto'>
              <Plus className='w-4 h-4' />
              Nueva orden
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Total de ordenes
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>{data?.total || 0}</div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>en el sistema</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                En proceso
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>
                {data?.items?.filter((o) => o.status === 'process').length || 0}
              </div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>pendientes de completar</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Entregadas
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>
                {data?.items?.filter((o) => o.status === 'delivered').length || 0}
              </div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>completadas</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-red-500'>
            <CardHeader className='pb-0.5 pt-2 px-3 sm:pb-1 sm:pt-3 sm:px-4'>
              <CardTitle className='text-[11px] sm:text-xs font-medium text-muted-foreground leading-tight'>
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent className='px-3 pb-2 pt-1 sm:px-4 sm:pb-3'>
              <div className='text-lg sm:text-2xl font-bold leading-none'>
                {data?.items?.filter((o) => o.status === 'cancelled').length || 0}
              </div>
              <p className='hidden sm:block text-xs text-muted-foreground mt-1'>sin procesar</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg'>Listado de ordenes</CardTitle>
            <CardDescription className='text-xs'>
              {data?.total} ordenes en total ({data?.page || 1} de {data?.totalPages || 1} paginas)
            </CardDescription>
          </CardHeader>

          <CardContent className='px-4'>
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3'>
                <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='font-semibold text-red-900'>Error al cargar ordenes</p>
                  <p className='text-red-700 text-sm'>{error instanceof Error ? error.message : 'Intenta de nuevo'}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-2'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                  <p className='text-muted-foreground'>Cargando ordenes...</p>
                </div>
              </div>
            ) : data?.items && data.items.length > 0 ? (
              <>
                <div className='space-y-3 lg:hidden'>
                  {data.items.map((order: Order, index: number) => (
                    <Card key={order.id} className='border border-border'>
                      <CardContent className='p-4 space-y-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <p className='text-xs text-muted-foreground'>Pedido</p>
                            <p className='font-semibold text-primary text-sm'>{getOrderNumber(index)}</p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                              statusColorMap[order.status]?.bg || 'bg-gray-100'
                            } ${statusColorMap[order.status]?.text || 'text-gray-800'}`}
                          >
                            {statusLabels[order.status] || order.status}
                          </div>
                        </div>

                        <div className='grid grid-cols-1 gap-2 text-xs'>
                          <div>
                            <p className='text-muted-foreground'>Cliente</p>
                            <p className='font-medium'>
                              {order.User?.firstName} {order.User?.lastName}
                            </p>
                            <p className='text-muted-foreground'>{order.User?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Fecha</p>
                            <p>{formatDate(order.createdAt || '')}</p>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Area</p>
                            <div
                              className='mt-1 px-2 py-1 rounded-full text-xs font-semibold text-white w-fit'
                              style={{ backgroundColor: order.area?.color || '#666' }}
                            >
                              {order.area?.name || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Productos</p>
                            <p className='font-medium'>{order.orderItems?.length || 0}</p>
                            {order.orderItems && order.orderItems.length > 0 && (
                              <p className='text-muted-foreground line-clamp-2'>
                                {order.orderItems
                                  .map((item) => `${item.quantity} ${item.product?.name}`)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='grid grid-cols-3 gap-2 pt-1'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-2 text-xs'
                            onClick={() => handleView(order)}
                          >
                            <Eye className='w-3.5 h-3.5 mr-1' />
                            Ver
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 px-2 text-xs'
                            onClick={() => handleEdit(order)}
                          >
                            <Pencil className='w-3.5 h-3.5 mr-1' />
                            Editar
                          </Button>
                          <Button
                            variant='destructive'
                            size='sm'
                            className='h-8 px-2 text-xs'
                            onClick={() => handleDelete(order)}
                            disabled={deleteMutation.isPending && deletingId === order.id}
                          >
                            {deleteMutation.isPending && deletingId === order.id ? (
                              <Loader2 className='w-3.5 h-3.5 animate-spin mr-1' />
                            ) : (
                              <Trash2 className='w-3.5 h-3.5 mr-1' />
                            )}
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className='relative overflow-x-auto hidden lg:block'>
                  <Table className='w-full table-fixed text-sm'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[170px] text-xs px-2'>Fecha</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Pedido</TableHead>
                        <TableHead className='w-[220px] text-xs px-2'>Cliente</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Area</TableHead>
                        <TableHead className='w-[280px] text-xs px-2'>Productos</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Estado</TableHead>
                        <TableHead className='sticky right-0 z-10 w-[128px] bg-background text-right text-xs px-2 border-l border-border'>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((order: Order, index: number) => (
                        <TableRow key={order.id} className='group hover:bg-muted/50'>
                          <TableCell className='text-xs text-muted-foreground whitespace-nowrap px-2'>
                            {formatDate(order.createdAt || '')}
                          </TableCell>
                          <TableCell className='font-semibold text-primary text-xs px-2'>
                            {getOrderNumber(index)}
                          </TableCell>
                          <TableCell className='px-2'>
                            <div className='min-w-0'>
                              <p className='font-medium text-xs truncate'>
                                {order.User?.firstName} {order.User?.lastName}
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>{order.User?.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className='px-2 py-1 rounded-full text-xs font-semibold text-white w-fit'
                              style={{ backgroundColor: order.area?.color || '#666' }}
                            >
                              {order.area?.name || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div className='text-xs min-w-0'>
                              <p className='font-medium'>{order.orderItems?.length || 0}</p>
                              {order.orderItems && order.orderItems.length > 0 && (
                                <p className='text-xs text-muted-foreground truncate'>
                                  {order.orderItems
                                    .map((item) => `${item.quantity} ${item.product?.name}`)
                                    .join(', ')}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                statusColorMap[order.status]?.bg || 'bg-gray-100'
                              } ${statusColorMap[order.status]?.text || 'text-gray-800'}`}
                            >
                              {statusLabels[order.status] || order.status}
                            </div>
                          </TableCell>
                          <TableCell className='sticky right-0 bg-background group-hover:bg-muted/50 text-right px-2 border-l border-border'>
                            <div className='flex justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0'
                                title='Ver'
                                aria-label='Ver'
                                onClick={() => handleView(order)}
                              >
                                <Eye className='w-3.5 h-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0'
                                title='Editar'
                                aria-label='Editar'
                                onClick={() => handleEdit(order)}
                              >
                                <Pencil className='w-3.5 h-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                                onClick={() => handleDelete(order)}
                                disabled={deleteMutation.isPending && deletingId === order.id}
                                title='Eliminar'
                                aria-label='Eliminar'
                              >
                                {deleteMutation.isPending && deletingId === order.id ? (
                                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                ) : (
                                  <Trash2 className='w-3.5 h-3.5' />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-3'>
                  <div className='text-xs text-muted-foreground'>
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, data.total)} de {data.total} ordenes
                  </div>
                  <div className='flex gap-2 items-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className='h-8 text-xs'
                    >
                      Anterior
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      <span className='text-xs font-medium'>
                        Pag {pagination.page} de {data.totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, data.totalPages),
                        }))
                      }
                      disabled={pagination.page >= data.totalPages}
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
                  <p className='text-muted-foreground text-lg'>No hay ordenes disponibles</p>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Comienza creando una nueva orden
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          orders={data?.items || []}
        />

        <Dialog open={detailDialogOpen} onOpenChange={handleDetailDialogOpenChange}>
          <DialogContent className='sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Detalle de orden #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>
                {selectedOrder
                  ? `${selectedOrder.User?.firstName || ''} ${selectedOrder.User?.lastName || ''} - ${formatDate(selectedOrder.createdAt)}`
                  : 'Sin orden seleccionada'}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder ? (
              <div className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-3 text-sm'>
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
                    <p className='font-medium'>{selectedOrder.orderItems?.length || 0}</p>
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
                      {(selectedOrder.orderItems || []).map((item) => (
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

            <DialogFooter className='gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => selectedOrder && handleDownloadOrder(selectedOrder)}
                disabled={!selectedOrder || isDownloadingOrder}
              >
                {isDownloadingOrder ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Download className='h-4 w-4 mr-2' />}
                Descargar orden
              </Button>
              <Button
                type='button'
                onClick={() => selectedOrder && router.push(`/dashboard/orders/edit/${selectedOrder.id}`)}
                disabled={!selectedOrder}
              >
                <Pencil className='h-4 w-4 mr-2' />
                Editar orden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
