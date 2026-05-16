'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useProductsQuery, usePurchaseQuery, useUnitMeasurementsQuery, useUpdatePurchaseMutation } from '@/lib/api';
import suppliersService, {
  type PurchaseItem,
} from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

type DraftItem = {
  key: string;
  id?: number;
  productId?: number;
  description: string;
  unitMeasurementId?: number;
  quantity: number;
  unitCost: number;
  isNew?: boolean;
};

type UnitOption = { id: number; label: string };

type NumericField = 'quantity' | 'unitCost';

function toDateInputValue(value?: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized || normalized === '.') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnitMeasurementId(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export default function EditSupplierPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rawId = params?.id;
  const purchaseId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  const [isSaving, setIsSaving] = useState(false);
  const [paid, setPaid] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [observation, setObservation] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [originalItems, setOriginalItems] = useState<PurchaseItem[]>([]);
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const { data: purchase, isLoading: isLoadingPurchase } = usePurchaseQuery(Number.isFinite(purchaseId) ? purchaseId : null);
  const updatePurchaseMutation = useUpdatePurchaseMutation(Number.isFinite(purchaseId) ? purchaseId : 0);

  const { data: productsData } = useProductsQuery();
  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();

  const products = useMemo(() => productsData?.items || [], [productsData?.items]);
  const unitMeasurementsMap = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    for (const u of unitMeasurements) {
      map.set(u.id, u);
    }
    return map;
  }, [unitMeasurements]);

  const getUnitOptions = useCallback((productId?: number): UnitOption[] => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    if (Array.isArray(product.productUnits) && product.productUnits.length > 0) {
      return product.productUnits
        .map((pu) => {
          const id = normalizeUnitMeasurementId(
            pu.unitMeasurementId ?? pu.unitMeasurement?.id
          );
          if (!id) return null;
          return {
            id,
            label: pu.unitMeasurement?.name ?? unitMeasurementsMap.get(id)?.name ?? `Unidad ${id}`,
          };
        })
        .filter((opt): opt is UnitOption => Boolean(opt))
        .filter((opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx);
    }

    if (Array.isArray(product.unitMeasurementIds) && product.unitMeasurementIds.length > 0) {
      return product.unitMeasurementIds
        .map((rawId) => normalizeUnitMeasurementId(rawId))
        .filter((id): id is number => Boolean(id))
        .map((id) => ({
          id,
          label: unitMeasurementsMap.get(id)?.name ?? `Unidad ${id}`,
        }));
    }

    return [];
  }, [products, unitMeasurementsMap]);

  useEffect(() => {
    if (!purchase) return;
    setPaid(Boolean(purchase.paid));
    setPurchaseDate(toDateInputValue(purchase.purchaseDate || purchase.createdAt));
    setObservation(purchase.observation || '');

    const initialItems = (purchase.purchaseItems || []).map((item) => ({
      key: `existing-${item.id}`,
      id: item.id,
      productId: item.productId,
      description: item.product?.name || item.description || 'Producto',
      unitMeasurementId: normalizeUnitMeasurementId(item.unitMeasurementId),
      quantity: Number(item.quantity) || 0,
      unitCost: Number(item.unitCost) || 0,
    }));
    setItems(initialItems);
    setOriginalItems((purchase.purchaseItems || []).map((item) => ({ ...item })));
  }, [purchase]);

  const filteredProducts = useMemo(() => {
    const term = searchProduct.trim().toLowerCase();
    if (!term) return [];
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }, [products, searchProduct]);

  useEffect(() => {
    if (products.length === 0) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.unitMeasurementId !== undefined && item.unitMeasurementId !== null) {
          return item;
        }
        const unitOptions = getUnitOptions(item.productId);
        if (unitOptions.length === 1) {
          changed = true;
          return { ...item, unitMeasurementId: unitOptions[0].id };
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [getUnitOptions, products.length]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitCost) || 0), 0),
    [items]
  );

  const getDraftKey = (key: string, field: NumericField) => `${key}-${field}`;

  const handleItemNumericChange = (
    itemKey: string,
    field: NumericField,
    rawValue: string,
    minValue: number
  ) => {
    const draftKey = getDraftKey(itemKey, field);
    setDraftInputs((prev) => ({ ...prev, [draftKey]: rawValue }));

    const parsed = parseDecimalInput(rawValue);
    if (parsed === null) return;

    setItems((prev) =>
      prev.map((item) =>
        item.key === itemKey ? { ...item, [field]: Math.max(minValue, parsed) } : item
      )
    );
  };

  const handleItemNumericBlur = (
    itemKey: string,
    field: NumericField,
    fallbackValue: number,
    minValue: number
  ) => {
    const draftKey = getDraftKey(itemKey, field);
    const item = items.find((entry) => entry.key === itemKey);
    if (!item) return;

    const rawValue = draftInputs[draftKey] ?? String(item[field]);
    const parsed = parseDecimalInput(rawValue);
    const nextValue = Math.max(minValue, parsed ?? fallbackValue);

    setItems((prev) =>
      prev.map((entry) => (entry.key === itemKey ? { ...entry, [field]: nextValue } : entry))
    );

    setDraftInputs((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const handleAddProduct = (productIdValue: string) => {
    const productId = Number(productIdValue);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const unitOptions = getUnitOptions(productId);
    const existingUnitIds = new Set<number | null>(
      items
        .filter((item) => item.productId === productId)
        .map((item) => normalizeUnitMeasurementId(item.unitMeasurementId) ?? null)
    );

    const defaultUnitMeasurementId =
      unitOptions.length > 0
        ? (unitOptions.find((opt) => !existingUnitIds.has(opt.id))?.id ?? null)
        : null;

    if (unitOptions.length > 0 && defaultUnitMeasurementId === null) {
      toast.error('Ese producto ya tiene todas sus presentaciones agregadas');
      return;
    }

    const newItem: DraftItem = {
      key: `new-${product.id}-${defaultUnitMeasurementId ?? 'none'}-${Date.now()}`,
      productId: product.id,
      description: product.name,
      unitMeasurementId: defaultUnitMeasurementId ?? undefined,
      quantity: 1,
      unitCost: 0,
      isNew: true,
    };

    setItems((prev) => [...prev, newItem]);
    setSearchProduct('');
    setShowProductDropdown(false);
    toast.success('Producto agregado');
  };

  const handleUnitMeasurementChange = (itemKey: string, newUnitMeasurementIdRaw: number) => {
    const newUnitMeasurementId = normalizeUnitMeasurementId(newUnitMeasurementIdRaw);
    if (!newUnitMeasurementId) {
      toast.error('Selecciona una unidad de medida valida');
      return;
    }

    const currentItem = items.find((entry) => entry.key === itemKey);
    if (!currentItem) return;

    const alreadyExists = items.some(
      (item) =>
        item.key !== itemKey &&
        item.productId === currentItem.productId &&
        (item.unitMeasurementId ?? null) === (newUnitMeasurementId ?? null)
    );

    if (alreadyExists) {
      toast.error('Este producto ya esta agregado con esa presentacion');
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.key === itemKey ? { ...item, unitMeasurementId: newUnitMeasurementId } : item
      )
    );
  };

  const removeItem = (itemKey: string) => {
    setItems((prev) => prev.filter((item) => item.key !== itemKey));
    setDraftInputs((prev) => {
      const next = { ...prev };
      delete next[getDraftKey(itemKey, 'quantity')];
      delete next[getDraftKey(itemKey, 'unitCost')];
      return next;
    });
  };

  const handleSave = async () => {
    if (!purchase) return;

    const baseNormalizedItems = items.map((item) => ({
      ...item,
      unitMeasurementId: normalizeUnitMeasurementId(item.unitMeasurementId),
    }));

    const usedUnitsByProduct = new Map<number, Set<number>>();
    for (const item of baseNormalizedItems) {
      if (!item.productId || !item.unitMeasurementId) continue;
      if (!usedUnitsByProduct.has(item.productId)) {
        usedUnitsByProduct.set(item.productId, new Set<number>());
      }
      usedUnitsByProduct.get(item.productId)?.add(item.unitMeasurementId);
    }

    const normalizedItems = baseNormalizedItems.map((item) => {
      if (item.unitMeasurementId !== undefined && item.unitMeasurementId !== null) return item;

      const unitOptions = getUnitOptions(item.productId);
      if (unitOptions.length === 0 || !item.productId) return item;

      const usedForProduct = usedUnitsByProduct.get(item.productId) ?? new Set<number>();
      const nextUnitId = unitOptions.find((opt) => !usedForProduct.has(opt.id))?.id ?? unitOptions[0]?.id;
      if (!nextUnitId) return item;

      usedForProduct.add(nextUnitId);
      usedUnitsByProduct.set(item.productId, usedForProduct);

      return { ...item, unitMeasurementId: nextUnitId };
    });

    if (normalizedItems.length === 0) {
      toast.error('Debes mantener al menos un producto');
      return;
    }

    const invalidItem = normalizedItems.find((item) => item.quantity <= 0 || item.unitCost < 0);
    if (invalidItem) {
      toast.error('Revisa cantidad y precio de los productos');
      return;
    }

    const missingUnit = normalizedItems.find((item) => {
      const unitOptions = getUnitOptions(item.productId);
      return unitOptions.length > 0 && (item.unitMeasurementId === undefined || item.unitMeasurementId === null);
    });
    if (missingUnit) {
      toast.error(`Selecciona unidad para: ${missingUnit.description}`);
      return;
    }

    setItems(normalizedItems);

    setIsSaving(true);
    try {
      await updatePurchaseMutation.mutateAsync({
        paid,
        purchaseDate: purchaseDate || undefined,
        observation: observation.trim() || undefined,
      });

      const originalById = new Map<number, PurchaseItem>(originalItems.map((item) => [item.id, item]));
      const currentExistingIds = new Set<number>(normalizedItems.filter((item) => item.id).map((item) => item.id as number));

      const deletedIds = originalItems
        .filter((item) => !currentExistingIds.has(item.id))
        .map((item) => item.id);

      const updatePromises = normalizedItems
        .filter((item) => item.id)
        .map(async (item) => {
          const original = originalById.get(item.id as number);
          if (!original) return;

          const payload: {
            productId?: number;
            description?: string;
            quantity?: number;
            unitMeasurementId?: number;
            unitCost?: number;
          } = {};

          if ((item.productId ?? null) !== (original.productId ?? null) && item.productId) payload.productId = item.productId;
          if ((item.description || '') !== (original.description || '')) payload.description = item.description;
          if (Number(item.quantity) !== Number(original.quantity)) payload.quantity = Number(item.quantity);
          if ((item.unitMeasurementId ?? null) !== (original.unitMeasurementId ?? null)) {
            payload.unitMeasurementId = item.unitMeasurementId;
          }
          if (Number(item.unitCost) !== Number(original.unitCost)) payload.unitCost = Number(item.unitCost);

          if (Object.keys(payload).length === 0) return;
          await suppliersService.updatePurchaseItem(item.id as number, payload);
        });

      await Promise.all(updatePromises);

      const newItems = normalizedItems.filter((item) => item.isNew || !item.id);
      await Promise.all(
        newItems.map((item) =>
          suppliersService.createPurchaseItem(purchase.id, {
            productId: item.productId || undefined,
            description: item.description,
            quantity: Number(item.quantity),
            unitMeasurementId: item.unitMeasurementId,
            unitCost: Number(item.unitCost),
          })
        )
      );
      await Promise.all(deletedIds.map((itemId) => suppliersService.deletePurchaseItem(itemId)));

      const supplierId = (purchase as unknown as { supplierId?: number; suplierId?: number }).supplierId
        ?? (purchase as unknown as { supplierId?: number; suplierId?: number }).suplierId;

      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
      if (supplierId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(supplierId) });
      }

      toast.success('Compra actualizada');
      router.push('/dashboard/supliers');
    } catch (error) {
      console.error('[EditSupplierPurchasePage] Error saving purchase:', error);
      toast.error('No se pudo actualizar la compra');
    } finally {
      setIsSaving(false);
    }
  };

  if (!Number.isFinite(purchaseId)) {
    return <div className="p-6 text-sm text-red-700">ID de compra invalido.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-700">Editar compra</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/supliers">
            <Button size="sm" variant="outline" className="h-9">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {isLoadingPurchase ? (
          <Card>
            <CardContent className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando compra...
            </CardContent>
          </Card>
        ) : !purchase ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-red-700">
              No se encontro la compra solicitada.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compra #{purchase.id}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Fecha de compra</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagado</Label>
                  <Select value={paid ? 'yes' : 'no'} onValueChange={(value) => setPaid(value === 'yes')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pagado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Si</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search-product">Agregar producto</Label>
                  <div className="relative">
                    <Input
                      id="search-product"
                      placeholder="Buscar producto..."
                      value={searchProduct}
                      onChange={(e) => {
                        setSearchProduct(e.target.value);
                        setShowProductDropdown(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (searchProduct.trim().length > 0) setShowProductDropdown(true);
                      }}
                    />
                    {showProductDropdown && searchProduct.trim().length > 0 && filteredProducts.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border bg-white shadow-lg">
                        {filteredProducts.slice(0, 10).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0"
                            onClick={() => handleAddProduct(String(product.id))}
                          >
                            <span>{product.name}</span>
                            <Plus className="h-4 w-4 text-blue-600" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-600">No hay productos en la compra.</p>
                ) : (
                  items.map((item) => {
                    const unitOptions = getUnitOptions(item.productId);
                    const selectedUnitLabel =
                      unitOptions.find((u) => u.id === item.unitMeasurementId)?.label ?? 'Unidad';
                    return (
                      <div key={item.key} className="rounded-lg border bg-white p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.description}</p>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeItem(item.key)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Unidad</Label>
                            {unitOptions.length === 0 ? (
                              <Input disabled value="-" />
                            ) : (
                              <Select
                                value={
                                  item.unitMeasurementId !== undefined && item.unitMeasurementId !== null
                                    ? String(item.unitMeasurementId)
                                    : undefined
                                }
                                onValueChange={(value) => handleUnitMeasurementChange(item.key, Number(value))}
                                disabled={unitOptions.length <= 1}
                              >
                                <SelectTrigger>
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
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Cantidad</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={draftInputs[getDraftKey(item.key, 'quantity')] ?? String(item.quantity)}
                              onChange={(e) => handleItemNumericChange(item.key, 'quantity', e.target.value, 0.01)}
                              onBlur={() => handleItemNumericBlur(item.key, 'quantity', 1, 0.01)}
                              className="text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Precio</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={draftInputs[getDraftKey(item.key, 'unitCost')] ?? String(item.unitCost)}
                              onChange={(e) => handleItemNumericChange(item.key, 'unitCost', e.target.value, 0)}
                              onBlur={() => handleItemNumericBlur(item.key, 'unitCost', 0, 0)}
                              className="text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-600">Subtotal</Label>
                            <Input
                              disabled
                              value={`S/. ${(item.quantity * item.unitCost).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`}
                              className="text-right font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="flex justify-end pt-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-slate-600">Total</p>
                    <p className="text-xl font-bold text-blue-700">
                      S/. {totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observacion</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Observacion de la compra"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => router.push('/dashboard/supliers')} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar cambios
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
