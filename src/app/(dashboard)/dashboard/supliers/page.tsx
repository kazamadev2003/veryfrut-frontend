'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, ShoppingCart, Package, TrendingUp, Loader2, AlertCircle, FileText, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliersQuery, useUnitMeasurementsQuery } from '@/lib/api';
import {
  generateDailyReportByClient,
  generateReportByProductUnit,
} from '@/lib/utils/report-generator';
import suppliersService, { type Purchase, type PurchaseItem } from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

const PERU_TIME_ZONE = 'America/Lima';
const peruDateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: PERU_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export default function SuppliersPage() {
  const router = useRouter();
  const { data: suppliersData, isLoading, error, refetch } = useSuppliersQuery();
  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();
  const queryClient = useQueryClient();
  const [reportLoading, setReportLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProductReportSupplierId, setSelectedProductReportSupplierId] = useState('');
  const [openSupplierId, setOpenSupplierId] = useState<number | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<{
    supplierId: number;
    purchase: Purchase;
  } | null>(null);
  const [editPaid, setEditPaid] = useState(false);
  const [editPurchaseDate, setEditPurchaseDate] = useState('');
  const [editItems, setEditItems] = useState<PurchaseItem[]>([]);
  const [originalEditItems, setOriginalEditItems] = useState<PurchaseItem[]>([]);
  const [editItemDrafts, setEditItemDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const parseDateFromInput = (value: string, boundary: 'start' | 'end'): Date | undefined => {
    if (!value) return undefined;
    const [yearRaw, monthRaw, dayRaw] = value.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
    if (boundary === 'start') return new Date(year, month - 1, day, 0, 0, 0, 0);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  };

  // Calcular estadísticas
  const suppliers = suppliersData?.data || [];
  const totalSuppliers = suppliers.length;

  const unitMeasurementsMap = new Map<number, { id: number; name: string }>(
    unitMeasurements.map((u) => [u.id, u])
  );

  const getUnitLabel = (item: { unitMeasurement?: { name: string; abbreviation: string }; unitMeasurementId?: number }) => {
    if (item.unitMeasurement?.abbreviation) return item.unitMeasurement.abbreviation;
    if (item.unitMeasurement?.name) return item.unitMeasurement.name;
    if (typeof item.unitMeasurementId === 'number') return unitMeasurementsMap.get(item.unitMeasurementId)?.name || `Unidad ${item.unitMeasurementId}`;
    return '-';
  };
  // Respect edited purchaseDate first; fallback to createdAt only when purchaseDate is missing.
  const getPurchaseDate = (purchase: Purchase) => purchase.purchaseDate || purchase.createdAt;
  const formatPurchaseDate = (value?: string) => {
    if (!value) return 'N/A';

    const hasExplicitTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(value);

    // Preserve local date/time only when backend does not include timezone info.
    const localMatch = !hasExplicitTimeZone
      ? value.match(
          /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
        )
      : null;
    if (localMatch) {
      const [, year, month, day, hour = '00', minute = '00', second = '00'] = localMatch;
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return peruDateTimeFormatter.format(parsed);
  };

  const toDateInputValue = (value?: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDeletePurchase = async (supplierId: number, purchaseId: number) => {
    if (!confirm('¿Eliminar esta compra?')) return;

    try {
      const result = await suppliersService.deletePurchase(purchaseId);
      if (result.success) {
        toast.success('Compra eliminada');
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(supplierId) });
      } else {
        toast.error('No se pudo eliminar la compra');
      }
    } catch (error) {
      toast.error('Error al eliminar la compra');
      console.error(error);
    }
  };

  const openEditPurchase = (supplierId: number, purchase: Purchase) => {
    setEditingPurchase({ supplierId, purchase });
    setEditPaid(Boolean(purchase.paid));
    setEditPurchaseDate(toDateInputValue(getPurchaseDate(purchase)));
    const initialItems = (purchase.purchaseItems || []).map((item) => ({ ...item }));
    setEditItems(initialItems);
    setOriginalEditItems(initialItems);
    setEditItemDrafts({});
    setEditOpen(true);
  };

  type EditableNumericField = 'quantity' | 'unitCost';

  const getDraftKey = (itemId: number, field: EditableNumericField) => `${itemId}-${field}`;

  const parseDecimalInput = (value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized || normalized === '.') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const updateEditItemField = (itemId: number, field: EditableNumericField, value: number) => {
    setEditItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const handleEditNumericInputChange = (
    itemId: number,
    field: EditableNumericField,
    rawValue: string,
    minValue: number
  ) => {
    const draftKey = getDraftKey(itemId, field);
    setEditItemDrafts((prev) => ({ ...prev, [draftKey]: rawValue }));

    const parsed = parseDecimalInput(rawValue);
    if (parsed === null) return;

    updateEditItemField(itemId, field, Math.max(minValue, parsed));
  };

  const handleEditNumericInputBlur = (
    itemId: number,
    field: EditableNumericField,
    fallbackValue: number,
    minValue: number
  ) => {
    const draftKey = getDraftKey(itemId, field);
    const item = editItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const rawValue = editItemDrafts[draftKey] ?? String(item[field]);
    const parsed = parseDecimalInput(rawValue);
    const nextValue = Math.max(minValue, parsed ?? fallbackValue);

    updateEditItemField(itemId, field, nextValue);

    setEditItemDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const handleRemoveEditItem = (itemId: number) => {
    setEditItems((prev) => prev.filter((item) => item.id !== itemId));
    setEditItemDrafts((prev) => {
      const next = { ...prev };
      delete next[getDraftKey(itemId, 'quantity')];
      delete next[getDraftKey(itemId, 'unitCost')];
      return next;
    });
  };

  const computedEditTotal = editItems.reduce(
    (sum, item) => sum + (Number(item.quantity) * Number(item.unitCost) || 0),
    0
  );

  const handleSaveEdit = async () => {
    if (!editingPurchase) return;

    try {
      await suppliersService.updatePurchase(editingPurchase.purchase.id, {
        paid: editPaid,
        purchaseDate: editPurchaseDate || undefined,
      });

      const originalById = new Map<number, PurchaseItem>(
        originalEditItems.map((item) => [item.id, item])
      );
      const currentIds = new Set<number>(editItems.map((item) => item.id));

      const itemUpdates = editItems.map(async (item) => {
        const original = originalById.get(item.id);
        if (!original) return;

        const payload: {
          quantity?: number;
          unitCost?: number;
          description?: string;
          productId?: number;
          unitMeasurementId?: number;
        } = {};

        if (Number(item.quantity) !== Number(original.quantity)) {
          payload.quantity = Number(item.quantity);
        }
        if (Number(item.unitCost) !== Number(original.unitCost)) {
          payload.unitCost = Number(item.unitCost);
        }
        if ((item.description || '') !== (original.description || '')) {
          payload.description = item.description;
        }
        if ((item.productId ?? null) !== (original.productId ?? null)) {
          payload.productId = item.productId;
        }
        if ((item.unitMeasurementId ?? null) !== (original.unitMeasurementId ?? null)) {
          payload.unitMeasurementId = item.unitMeasurementId;
        }

        if (Object.keys(payload).length === 0) return;
        await suppliersService.updatePurchaseItem(item.id, payload);
      });

      const deletedIds = originalEditItems
        .filter((item) => !currentIds.has(item.id))
        .map((item) => item.id);

      const itemDeletes = deletedIds.map((itemId) => suppliersService.deletePurchaseItem(itemId));

      await Promise.all([...itemUpdates, ...itemDeletes]);

      toast.success('Compra actualizada');
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(editingPurchase.supplierId) });
    } catch (error) {
      toast.error('Error al actualizar la compra');
      console.error(error);
    }
  };

  const handleDailyReport = async () => {
    const start = startDate ? parseDateFromInput(startDate, 'start') : undefined;
    const end = endDate ? parseDateFromInput(endDate, 'end') : undefined;

    if (startDate && !start) {
      toast.error('Fecha inicio invalida');
      return;
    }
    if (endDate && !end) {
      toast.error('Fecha fin invalida');
      return;
    }
    if (start && end && start > end) {
      toast.error('La fecha fin debe ser mayor o igual a la fecha inicio');
      return;
    }

    try {
      setReportLoading(true);

      const filename = `reporte_diario_${new Date().toISOString().split('T')[0]}.xlsx`;
      await generateDailyReportByClient({
        filename,
        suppliers,
        startDate: start,
        endDate: end,
      });
      toast.success('Reporte diario generado');
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleProductReport = async () => {
    const start = startDate ? parseDateFromInput(startDate, 'start') : undefined;
    const end = endDate ? parseDateFromInput(endDate, 'end') : undefined;
    const supplierId = Number(selectedProductReportSupplierId);

    if (startDate && !start) {
      toast.error('Fecha inicio invalida');
      return;
    }
    if (endDate && !end) {
      toast.error('Fecha fin invalida');
      return;
    }
    if (start && end && start > end) {
      toast.error('La fecha fin debe ser mayor o igual a la fecha inicio');
      return;
    }
    if (!Number.isFinite(supplierId)) {
      toast.error('Selecciona un proveedor');
      return;
    }

    const selectedSupplier = suppliers.find((supplier) => supplier.id === supplierId);
    if (!selectedSupplier) {
      toast.error('Proveedor no encontrado');
      return;
    }

    try {
      setReportLoading(true);

      const filename = `reporte_productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      await generateReportByProductUnit({
        filename,
        suppliers: [selectedSupplier],
        startDate: start,
        endDate: end,
      });
      toast.success('Reporte de productos generado');
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };
  const totalPurchases = suppliers.reduce((sum, supplier) => sum + (supplier.purchases?.length || 0), 0);
  const totalAmount = suppliers.reduce((sum, supplier) => {
    return sum + (supplier.purchases?.reduce((purchaseSum, purchase) => purchaseSum + (purchase.totalAmount || 0), 0) || 0);
  }, 0);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((supplier) => {
    if (!normalizedSearch) return true;
    return [
      supplier.name,
      supplier.companyName,
      supplier.contactName,
      supplier.email,
      supplier.phone,
      supplier.address,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const stats = [
    {
      title: 'Total Proveedores',
      value: totalSuppliers.toString(),
      description: 'Proveedores activos en el sistema',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Compras Registradas',
      value: totalPurchases.toString(),
      description: 'Transacciones completadas',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Productos Únicos',
      value: suppliers.reduce((sum, supplier) => {
        return sum + (supplier.purchases?.reduce((itemSum, purchase) => itemSum + (purchase.purchaseItems?.length || 0), 0) || 0);
      }, 0).toString(),
      description: 'Diferentes productos comprados',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Inversión Total',
      value: `S/. ${totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
      description: 'Monto invertido en compras',
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-700">Proveedores</span>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <Link href="/dashboard/supliers/create" className="w-full sm:w-auto">
            <Button size="sm" className="h-9 w-full bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:w-auto sm:text-sm">
              Crear Proveedor
            </Button>
          </Link>
          <Link href="/dashboard/supliers/purchases" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="h-9 w-full px-3 text-xs sm:w-auto sm:text-sm">
              Registrar Compra
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Gestión de Proveedores</h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl">
            Administra proveedores, registra compras y controla tu inventario de forma eficiente.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reports Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 rounded-lg mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Reportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Daily Report Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-12 w-full">
                <FileText className="h-5 w-5 mr-2" />
                Reporte General
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Reporte General</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para generar el reporte en Excel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDailyReport}
                  disabled={reportLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {reportLoading ? 'Generando...' : 'Descargar Reporte'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product Report Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 w-full">
                <FileText className="h-5 w-5 mr-2" />
                Reporte total por proveedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Reporte Total por Proveedor</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para generar el reporte agrupado por proveedor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-product-report">Proveedor</Label>
                  <Select
                    value={selectedProductReportSupplierId}
                    onValueChange={setSelectedProductReportSupplierId}
                  >
                    <SelectTrigger id="supplier-product-report">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date-product">Fecha Inicio</Label>
                  <Input
                    id="start-date-product"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date-product">Fecha Fin</Label>
                  <Input
                    id="end-date-product"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleProductReport}
                  disabled={reportLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {reportLoading ? 'Generando...' : 'Descargar Reporte'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Suppliers and Purchases Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Proveedores y Compras</h2>
        <div className="mb-8">
          <Label htmlFor="supplier-search" className="mb-2 block">
            Buscar proveedor
          </Label>
          <Input
            id="supplier-search"
            type="text"
            placeholder="Buscar por nombre, empresa, contacto, email, telefono o direccion"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Edit Purchase Dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              setEditingPurchase(null);
              setEditPurchaseDate('');
              setEditItems([]);
              setOriginalEditItems([]);
              setEditItemDrafts({});
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Editar compra</DialogTitle>
              <DialogDescription>
                {editingPurchase ? `Compra #${editingPurchase.purchase.id}` : 'Selecciona una compra'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-date">Fecha de compra</Label>
                <Input
                  id="edit-purchase-date"
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                />
              </div>

              {editItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Items</Label>
                  <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 p-2 sm:p-3">
                    <div className="space-y-3 md:hidden">
                      {editItems.map((item) => (
                        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
                          <p className="mb-3 text-sm font-semibold text-slate-800">{item.product?.name || item.description || '-'}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-slate-600">Cantidad</Label>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={editItemDrafts[getDraftKey(item.id, 'quantity')] ?? String(item.quantity)}
                                onChange={(e) =>
                                  handleEditNumericInputChange(item.id, 'quantity', e.target.value, 1)
                                }
                                onBlur={() => handleEditNumericInputBlur(item.id, 'quantity', 1, 1)}
                                className="mt-1 h-9 text-right"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-slate-600">Precio</Label>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={editItemDrafts[getDraftKey(item.id, 'unitCost')] ?? String(item.unitCost)}
                                onChange={(e) =>
                                  handleEditNumericInputChange(item.id, 'unitCost', e.target.value, 0)
                                }
                                onBlur={() => handleEditNumericInputBlur(item.id, 'unitCost', 0, 0)}
                                className="mt-1 h-9 text-right"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">
                              Subtotal: S/. {(item.quantity * item.unitCost).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                            </p>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handleRemoveEditItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-2 text-left font-semibold text-slate-700">Producto</th>
                            <th className="p-2 text-right font-semibold text-slate-700">Cantidad</th>
                            <th className="p-2 text-right font-semibold text-slate-700">Precio</th>
                            <th className="p-2 text-right font-semibold text-slate-700">Subtotal</th>
                            <th className="p-2 text-center font-semibold text-slate-700">Accion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editItems.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="p-2 text-slate-700">{item.product?.name || item.description || '-'}</td>
                              <td className="p-2 text-right">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={editItemDrafts[getDraftKey(item.id, 'quantity')] ?? String(item.quantity)}
                                  onChange={(e) =>
                                    handleEditNumericInputChange(item.id, 'quantity', e.target.value, 1)
                                  }
                                  onBlur={() => handleEditNumericInputBlur(item.id, 'quantity', 1, 1)}
                                  className="ml-auto h-8 w-24 text-right"
                                />
                              </td>
                              <td className="p-2 text-right">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={editItemDrafts[getDraftKey(item.id, 'unitCost')] ?? String(item.unitCost)}
                                  onChange={(e) =>
                                    handleEditNumericInputChange(item.id, 'unitCost', e.target.value, 0)
                                  }
                                  onBlur={() => handleEditNumericInputBlur(item.id, 'unitCost', 0, 0)}
                                  className="ml-auto h-8 w-28 text-right"
                                />
                              </td>
                              <td className="p-2 text-right font-semibold text-slate-900">
                                S/. {(item.quantity * item.unitCost).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                              </td>
                              <td className="p-2 text-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleRemoveEditItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-900">
                    Total calculado: S/. {computedEditTotal.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Pagado</Label>
                <Select
                  value={editPaid ? 'yes' : 'no'}
                  onValueChange={(value) => setEditPaid(value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Pagado?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!editingPurchase) return;
                  setEditOpen(false);
                  router.push(`/dashboard/supliers/edit/${editingPurchase.purchase.id}`);
                }}
                disabled={!editingPurchase}
              >
                Agregar producto
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={!editingPurchase}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600 font-medium">Cargando proveedores...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error al cargar proveedores</p>
                <p className="text-sm text-red-700">No pudimos conectar con el servidor. Intenta nuevamente.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && suppliers.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-blue-900 font-semibold text-lg mb-2">No hay proveedores registrados</p>
              <p className="text-blue-700 mb-6">Comienza creando tu primer proveedor</p>
              <Link href="/dashboard/supliers/create">
                <Button className="bg-blue-600 hover:bg-blue-700">Crear Primer Proveedor</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && suppliers.length > 0 && (
          <div className="space-y-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <Collapsible
                  open={openSupplierId === supplier.id}
                  onOpenChange={(isOpen) =>
                    setOpenSupplierId((current) => (isOpen ? supplier.id : current === supplier.id ? null : current))
                  }
                >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">{supplier.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {supplier.companyName && <p className="text-slate-600">Empresa: {supplier.companyName}</p>}
                        {supplier.contactName && <p className="text-slate-600">Contacto: {supplier.contactName}</p>}
                        {supplier.email && <p className="text-slate-600">Email: {supplier.email}</p>}
                        {supplier.phone && <p className="text-slate-600">Teléfono: {supplier.phone}</p>}
                        {supplier.address && <p className="text-slate-600">Dirección: {supplier.address}</p>}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                        {supplier.purchases?.length || 0} compras
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button type="button" size="sm" variant="outline" className="gap-1">
                          {openSupplierId === supplier.id ? 'Ocultar compras' : 'Ver compras'}
                          {openSupplierId === supplier.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent className="pt-6">
                  {supplier.purchases && supplier.purchases.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Compras realizadas:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 border-b">
                            <tr>
                              <th className="text-left p-3 font-semibold text-slate-700">ID</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Fecha</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Productos</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Monto Total</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Pagado</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplier.purchases.map((purchase) => (
                              <tr key={purchase.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-3 text-slate-600">#{purchase.id}</td>
                                <td className="p-3 text-slate-600">
                                  {formatPurchaseDate(getPurchaseDate(purchase))}
                                </td>
                                <td className="p-3">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium hover:bg-purple-200 transition"
                                      >
                                        {purchase.purchaseItems?.length || 0} items
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader>
                                        <DialogTitle>Items de compra #{purchase.id}</DialogTitle>
                                        <DialogDescription>
                                          {supplier.name} • {formatPurchaseDate(getPurchaseDate(purchase))}
                                        </DialogDescription>
                                      </DialogHeader>

                                      {purchase.purchaseItems && purchase.purchaseItems.length > 0 ? (
                                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                          <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b">
                                              <tr>
                                                <th className="text-left p-3 font-semibold text-slate-700">Producto</th>
                                                <th className="text-left p-3 font-semibold text-slate-700">Unidad</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Cantidad</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Precio</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Subtotal</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {purchase.purchaseItems.map((item) => (
                                                <tr key={item.id} className="border-b last:border-b-0">
                                                  <td className="p-3 text-slate-700">
                                                    {item.product?.name || item.description || '-'}
                                                  </td>
                                                  <td className="p-3 text-slate-600">{getUnitLabel(item)}</td>
                                                  <td className="p-3 text-right text-slate-700">{item.quantity}</td>
                                                  <td className="p-3 text-right text-slate-700">
                                                    S/. {item.unitCost.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                                  </td>
                                                  <td className="p-3 text-right font-semibold text-slate-900">
                                                    S/. {(item.quantity * item.unitCost).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-slate-600">No hay items en esta compra</p>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </td>
                                <td className="p-3 font-semibold text-slate-900">
                                  S/. {purchase.totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    purchase.paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {purchase.paid ? 'Sí' : 'No'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openEditPurchase(supplier.id, purchase)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => handleDeletePurchase(supplier.id, purchase.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600">No hay compras registradas</p>
                  )}
                </CardContent>
                </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            {filteredSuppliers.length === 0 && (
              <Card className="border-slate-200 bg-slate-50 text-center py-10">
                <CardContent>
                  <p className="font-semibold text-slate-900">Sin resultados</p>
                  <p className="text-sm text-slate-600">No hay proveedores que coincidan con tu busqueda.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 mb-12">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-indigo-900">Sistema Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-800 mb-4">
              Nuestro sistema de gestión de proveedores está diseñado para ser intuitivo y fácil de usar. Con una interfaz clara y organizada, puedes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">📋 Administración Eficiente</p>
                <p className="text-sm text-indigo-800">Mantén un registro completo de todos tus proveedores y sus datos de contacto en un solo lugar.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">💰 Control Financiero</p>
                <p className="text-sm text-indigo-800">Rastrea todas tus compras y gastos con detalle, incluyendo fechas de pago y estados.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">📊 Análisis de Datos</p>
                <p className="text-sm text-indigo-800">Obtén reportes y estadísticas sobre tus compras y proveedores para tomar mejores decisiones.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">🔄 Fácil de Usar</p>
                <p className="text-sm text-indigo-800">Interfaz intuitiva que no requiere capacitación. Comienza a usar en minutos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

