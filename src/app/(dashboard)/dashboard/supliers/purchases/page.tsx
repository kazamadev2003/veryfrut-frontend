'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader, ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CreatePurchaseInput, PurchaseItem, Purchase } from '@/types/supplier';
import { useProductsQuery, useSuppliersQuery, useUnitMeasurementsQuery } from '@/lib/api';
import suppliersService from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

export default function RegisterPurchasesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [isLoading, setIsLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: suppliersData, isLoading: loadingSuppliers } = useSuppliersQuery();
  const { data: productsData } = useProductsQuery();
  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();
  const suppliers = suppliersData?.data || [];
  const products = productsData?.items || [];

  const unitMeasurementsMap = React.useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    unitMeasurements.forEach((u) => map.set(u.id, u));
    return map;
  }, [unitMeasurements]);

  type UnitOption = { id: number; label: string };
  const getUnitOptions = (product: (typeof products)[number] | undefined): UnitOption[] => {
    if (!product) return [];

    if (Array.isArray(product.productUnits) && product.productUnits.length > 0) {
      return product.productUnits
        .map((pu) => ({
          id: pu.unitMeasurementId,
          label:
            pu.unitMeasurement?.name ??
            unitMeasurementsMap.get(pu.unitMeasurementId)?.name ??
            `Unidad ${pu.unitMeasurementId}`,
        }))
        .filter((opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx);
    }

    if (Array.isArray(product.unitMeasurementIds) && product.unitMeasurementIds.length > 0) {
      return product.unitMeasurementIds.map((id) => ({
        id,
        label: unitMeasurementsMap.get(id)?.name ?? `Unidad ${id}`,
      }));
    }

    return [];
  };

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [observation, setObservation] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [itemInputDrafts, setItemInputDrafts] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreatePurchaseInput>({
    areaId: null,
    totalAmount: 0,
    purchaseDate: today,
    purchaseItems: [],
  });

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
  };

  const addProductToTable = (productId: string) => {
    if (!productId) return;

    const product = products.find((p) => p.id === Number(productId));
    if (!product) return;

    const unitOptions = getUnitOptions(product);
    const productIdNumber = Number(productId);

    if (unitOptions.length === 0) {
      const exists = formData.purchaseItems.some((item) => item.productId === productIdNumber);
      if (exists) {
        toast.error('Este producto ya está en la tabla');
        return;
      }
    }

    const existingUnitIds = new Set<number | null>(
      formData.purchaseItems
        .filter((item) => item.productId === productIdNumber)
        .map((item) => item.unitMeasurementId ?? null)
    );

    const defaultUnitMeasurementId =
      unitOptions.length > 0
        ? (unitOptions.find((opt) => !existingUnitIds.has(opt.id))?.id ?? null)
        : null;

    if (unitOptions.length > 0 && defaultUnitMeasurementId === null) {
      toast.error('Ya agregaste este producto con todas sus presentaciones');
      return;
    }

    const newItem: PurchaseItem = {
      productId: productIdNumber,
      description: product.name,
      quantity: 1,
      unitMeasurementId: defaultUnitMeasurementId ?? undefined,
      unitCost: 0,
    };

    setFormData((prev) => ({
      ...prev,
      purchaseItems: [...prev.purchaseItems, newItem],
    }));

    setSearchProduct('');
    setShowProductDropdown(false);
    toast.success('Producto agregado');
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updatedItems = [...prev.purchaseItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      const total = updatedItems.reduce(
        (sum, item) => sum + (Number(item.quantity) * Number(item.unitCost) || 0),
        0
      );

      return {
        ...prev,
        purchaseItems: updatedItems,
        totalAmount: total,
      };
    });
  };

  type NumericPurchaseField = 'quantity' | 'unitCost';

  const getDraftKey = (index: number, field: NumericPurchaseField) => `${index}-${field}`;

  const parseDecimalInput = (value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized || normalized === '.') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleNumericInputChange = (
    index: number,
    field: NumericPurchaseField,
    rawValue: string,
    minValue: number
  ) => {
    const draftKey = getDraftKey(index, field);
    setItemInputDrafts((prev) => ({ ...prev, [draftKey]: rawValue }));

    const parsed = parseDecimalInput(rawValue);
    if (parsed === null) return;

    handleItemChange(index, field, Math.max(minValue, parsed));
  };

  const handleNumericInputBlur = (
    index: number,
    field: NumericPurchaseField,
    fallbackValue: number,
    minValue: number
  ) => {
    const draftKey = getDraftKey(index, field);
    const item = formData.purchaseItems[index];
    if (!item) return;

    const rawValue = itemInputDrafts[draftKey] ?? String(item[field]);
    const parsed = parseDecimalInput(rawValue);
    const nextValue = Math.max(minValue, parsed ?? fallbackValue);

    handleItemChange(index, field, nextValue);

    setItemInputDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const handleUnitMeasurementChange = (index: number, newUnitMeasurementId: number) => {
    const currentItem = formData.purchaseItems[index];
    if (!currentItem) return;

    const alreadyExists = formData.purchaseItems.some(
      (item, i) =>
        i !== index &&
        item.productId === currentItem.productId &&
        (item.unitMeasurementId ?? null) === (newUnitMeasurementId ?? null)
    );

    if (alreadyExists) {
      toast.error('Este producto ya está agregado con esa presentación');
      return;
    }

    handleItemChange(index, 'unitMeasurementId', newUnitMeasurementId);
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.purchaseItems.filter((_, i) => i !== index);
    const total = updatedItems.reduce(
      (sum, item) => sum + (Number(item.quantity) * Number(item.unitCost) || 0),
      0
    );

    setFormData({
      ...formData,
      purchaseItems: updatedItems,
      totalAmount: total,
    });
    setItemInputDrafts({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }

    if (formData.purchaseItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const missingUnit = formData.purchaseItems.find((item) => {
      const product = products.find((p) => p.id === item.productId);
      const unitOptions = getUnitOptions(product);
      return unitOptions.length > 0 && (item.unitMeasurementId === undefined || item.unitMeasurementId === null);
    });

    if (missingUnit) {
      toast.error(`Selecciona la unidad/presentación para: ${missingUnit.description ?? 'el producto'}`);
      return;
    }

    setIsLoading(true);
    try {
      const purchaseData = {
        areaId: formData.areaId,
        totalAmount: formData.totalAmount,
        purchaseDate: formData.purchaseDate,
        purchaseItems: formData.purchaseItems,
      };

      const newPurchaseData = await suppliersService.createPurchase(Number(selectedSupplier), purchaseData);

      if (newPurchaseData) {
        const newPurchase: Purchase = {
          ...newPurchaseData,
          supplierId: Number(selectedSupplier),
        };

        if (observation) {
          await suppliersService.updatePurchase(newPurchase.id, { observation });
          newPurchase.observation = observation;
        }

        setPurchases((prev) => [newPurchase, ...prev]);
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.suppliers.purchaseLists(Number(selectedSupplier)),
        });
        await queryClient.refetchQueries({ queryKey: queryKeys.suppliers.lists(), type: 'all' });
        toast.success('Compra creada exitosamente');

        setFormData({
          areaId: null,
          totalAmount: 0,
          purchaseDate: today,
          purchaseItems: [],
        });
        setSelectedSupplier('');
        setObservation('');
        router.push('/dashboard/supliers');
      } else {
        toast.error('Error al registrar');
      }
    } catch (error) {
      toast.error('Error al registrar la compra');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePurchase = async (id: number) => {
    if (confirm('¿Eliminar esta compra?')) {
      try {
        const result = await suppliersService.deletePurchase(id);
        if (result.success) {
          setPurchases((prev) => prev.filter((p) => p.id !== id));
          await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
          await queryClient.refetchQueries({ queryKey: queryKeys.suppliers.lists(), type: 'all' });
          toast.success('Compra eliminada');
        } else {
          toast.error('Error al eliminar');
        }
      } catch (error) {
        toast.error('Error al eliminar');
        console.error(error);
      }
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-700">Proveedores</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/supliers">
            <Button size="sm" variant="outline">Ver Proveedores</Button>
          </Link>
          <Link href="/dashboard/supliers/create">
            <Button size="sm" variant="outline">Crear Proveedor</Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-4xl font-bold">Registrar Compras</h1>
          <p className="max-w-2xl text-slate-300">
            Agrega productos, cantidades y costos para registrar compras a proveedores.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proveedor y búsqueda */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-base text-slate-900">Información de la Compra</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Proveedor */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Proveedor *</Label>
                  {loadingSuppliers ? (
                    <div className="h-10 bg-slate-100 rounded-md flex items-center justify-center">
                      <Loader className="h-4 w-4 animate-spin text-slate-600" />
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="h-10 bg-red-50 rounded-md flex items-center gap-2 px-3 border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700">Sin proveedores</span>
                    </div>
                  ) : (
                    <Select value={selectedSupplier} onValueChange={handleSupplierChange}>
                      <SelectTrigger className="h-10 border-slate-200 text-sm">
                        <SelectValue placeholder="Selecciona proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier: typeof suppliers[0]) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Búsqueda de productos */}
                <div className="space-y-2">
                  <Label htmlFor="purchase-date" className="text-sm font-medium text-slate-700">Fecha de compra</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={formData.purchaseDate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        purchaseDate: e.target.value,
                      }))
                    }
                    className="h-10 border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-2 relative">
                  <Label className="text-sm font-medium text-slate-700">Buscar Producto</Label>
                  <div className="relative">
                    <Input
                      placeholder="Escribe el nombre del producto..."
                      value={searchProduct}
                      onChange={(e) => {
                        setSearchProduct(e.target.value);
                        setShowProductDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => searchProduct.length > 0 && setShowProductDropdown(true)}
                      className="h-10 border-slate-200 text-sm"
                    />

                    {/* Dropdown */}
                    {showProductDropdown && searchProduct && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredProducts.slice(0, 8).map((product: typeof products[0]) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProductToTable(product.id.toString())}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm text-slate-700 transition"
                          >
                            {product.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de productos */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {formData.purchaseItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Busca productos arriba para agregarlos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 md:hidden">
                    {formData.purchaseItems.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId);
                      const unitOptions = getUnitOptions(product);
                      const selectedUnitLabel =
                        unitOptions.find((u) => u.id === item.unitMeasurementId)?.label ?? '-';
                      return (
                        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
                          <p className="mb-3 text-sm font-semibold text-slate-900">{item.description}</p>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">Unidad</Label>
                              {unitOptions.length === 0 ? (
                                <p className="text-sm text-slate-700">-</p>
                              ) : (
                                <Select
                                  value={
                                    item.unitMeasurementId !== undefined && item.unitMeasurementId !== null
                                      ? String(item.unitMeasurementId)
                                      : ''
                                  }
                                  onValueChange={(value) => handleUnitMeasurementChange(index, Number(value))}
                                  disabled={unitOptions.length <= 1}
                                >
                                  <SelectTrigger className="h-9 w-full border-slate-200 text-sm">
                                    <SelectValue placeholder={selectedUnitLabel} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unitOptions.map((opt) => (
                                      <SelectItem key={opt.id} value={String(opt.id)}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Cantidad</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={itemInputDrafts[getDraftKey(index, 'quantity')] ?? String(item.quantity)}
                                  onChange={(e) =>
                                    handleNumericInputChange(index, 'quantity', e.target.value, 0.01)
                                  }
                                  onBlur={() => handleNumericInputBlur(index, 'quantity', 1, 0.01)}
                                  className="h-9 border-slate-200 text-right text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-600">Precio (S/.)</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={itemInputDrafts[getDraftKey(index, 'unitCost')] ?? String(item.unitCost)}
                                  onChange={(e) =>
                                    handleNumericInputChange(index, 'unitCost', e.target.value, 0)
                                  }
                                  onBlur={() => handleNumericInputBlur(index, 'unitCost', 0, 0)}
                                  className="h-9 border-slate-200 text-right text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                              <span className="text-xs font-medium text-slate-600">Subtotal</span>
                              <span className="text-sm font-semibold text-slate-900">
                                S/. {(item.quantity * item.unitCost).toFixed(2)}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => removeItem(index)}
                              className="h-9 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar producto
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden overflow-x-auto border border-slate-200 rounded-lg md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50 border-b">
                          <TableHead className="text-slate-900 font-semibold text-sm">Producto</TableHead>
                          <TableHead className="text-slate-900 font-semibold text-sm">Unidad</TableHead>
                          <TableHead className="text-slate-900 font-semibold text-sm text-right">Cantidad</TableHead>
                          <TableHead className="text-slate-900 font-semibold text-sm text-right">Precio (S/.)</TableHead>
                          <TableHead className="text-slate-900 font-semibold text-sm text-right">Subtotal</TableHead>
                          <TableHead className="text-slate-900 font-semibold text-sm text-center">Eliminar</TableHead>
                        </TableRow>
                      </TableHeader>
                        <TableBody>
                          {formData.purchaseItems.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId);
                          const unitOptions = getUnitOptions(product);
                          const selectedUnitLabel =
                            unitOptions.find((u) => u.id === item.unitMeasurementId)?.label ?? '-';
                          return (
                            <TableRow key={index} className="border-b last:border-b-0 hover:bg-slate-50">
                              <TableCell className="text-slate-700 text-sm py-3">{item.description}</TableCell>
                              <TableCell className="text-slate-600 text-sm py-3">
                                {unitOptions.length === 0 ? (
                                  '-'
                                ) : (
                                  <Select
                                    value={
                                      item.unitMeasurementId !== undefined && item.unitMeasurementId !== null
                                        ? String(item.unitMeasurementId)
                                        : ''
                                    }
                                    onValueChange={(value) => handleUnitMeasurementChange(index, Number(value))}
                                    disabled={unitOptions.length <= 1}
                                  >
                                    <SelectTrigger className="h-8 w-40 border-slate-200 text-sm">
                                      <SelectValue placeholder={selectedUnitLabel} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {unitOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={itemInputDrafts[getDraftKey(index, 'quantity')] ?? String(item.quantity)}
                                  onChange={(e) =>
                                    handleNumericInputChange(index, 'quantity', e.target.value, 0.01)
                                  }
                                  onBlur={() => handleNumericInputBlur(index, 'quantity', 1, 0.01)}
                                  className="w-16 h-8 text-right border-slate-200 text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-right py-3">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={itemInputDrafts[getDraftKey(index, 'unitCost')] ?? String(item.unitCost)}
                                  onChange={(e) =>
                                    handleNumericInputChange(index, 'unitCost', e.target.value, 0)
                                  }
                                  onBlur={() => handleNumericInputBlur(index, 'unitCost', 0, 0)}
                                  className="w-20 h-8 text-right border-slate-200 text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-right font-semibold text-slate-900 text-sm py-3">
                                S/. {(item.quantity * item.unitCost).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total */}
                  <div className="flex justify-end">
                    <div className="bg-blue-50 border border-blue-300 rounded-lg px-4 py-3 w-full min-w-0 sm:px-6 sm:py-4 sm:w-auto sm:min-w-max">
                      <div className="flex items-baseline gap-4">
                        <span className="text-slate-700 font-semibold">Total:</span>
                        <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                          S/. {formData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          {formData.purchaseItems.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b pb-4">
                <CardTitle className="text-base text-slate-900">Notas (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Agregar observaciones..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="border-slate-200 min-h-16 resize-none text-sm"
                />
              </CardContent>
            </Card>
          )}

          {/* Botones */}
          {formData.purchaseItems.length > 0 && (
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ areaId: null, totalAmount: 0, purchaseDate: today, purchaseItems: [] });
                  setSelectedSupplier('');
                  setObservation('');
                }}
                className="h-10"
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 gap-2 px-6"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Registrar Compra
                  </>
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Compras registradas */}
        {purchases.length > 0 && (
          <Card className="mt-8 border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-base text-slate-900">Compras Registradas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 md:hidden">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Compra #{purchase.id}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {purchase.status}
                      </span>
                    </div>
                    <div className="mb-3 rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-600">Total</p>
                      <p className="text-lg font-semibold text-slate-900">S/. {purchase.totalAmount.toFixed(2)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deletePurchase(purchase.id)}
                      className="h-9 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar compra
                    </Button>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto border border-slate-200 rounded-lg md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b">
                      <TableHead className="text-slate-900 font-semibold text-sm">ID</TableHead>
                      <TableHead className="text-slate-900 font-semibold text-sm">Fecha</TableHead>
                      <TableHead className="text-slate-900 font-semibold text-sm text-right">Total</TableHead>
                      <TableHead className="text-slate-900 font-semibold text-sm">Estado</TableHead>
                      <TableHead className="text-slate-900 font-semibold text-sm text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <TableCell className="text-slate-700 text-sm py-3">#{purchase.id}</TableCell>
                        <TableCell className="text-slate-700 text-sm py-3">
                          {new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 text-sm py-3">
                          S/. {purchase.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {purchase.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePurchase(purchase.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

