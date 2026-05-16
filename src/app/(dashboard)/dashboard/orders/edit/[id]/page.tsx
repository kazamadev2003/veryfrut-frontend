'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderQuery, useProductsQuery, useUpdateOrderMutation } from '@/lib/api';
import type { CreateOrderItemDto, Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DraftItem {
  key: string;
  productId: number;
  unitMeasurementId: number;
  productName: string;
  unitName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

function formatDate(date?: string) {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('es-ES');
}

function toNonNegativeNumber(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toInitialItems(order: Order): DraftItem[] {
  return (order.orderItems ?? []).map((item) => ({
    key: `existing-${item.id}`,
    productId: item.productId,
    unitMeasurementId: item.unitMeasurementId,
    productName: item.product?.name ?? `Producto ${item.productId}`,
    unitName: item.unitMeasurement?.name ?? `Unidad ${item.unitMeasurementId}`,
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    imageUrl: item.product?.imageUrl,
  }));
}

function EditOrderForm({ order }: { order: Order }) {
  const router = useRouter();
  const updateMutation = useUpdateOrderMutation(order.id);
  const { data: productsData } = useProductsQuery({ page: 1, limit: 300 });
  const products = useMemo(() => productsData?.items ?? [], [productsData?.items]);

  const [items, setItems] = useState<DraftItem[]>(() => toInitialItems(order));
  const [observation, setObservation] = useState(order.observation ?? '');
  const [productSearch, setProductSearch] = useState('');
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});

  const productUnitOptions = useMemo(() => {
    return products.flatMap((product) =>
      (product.productUnits ?? []).map((unit) => ({
        key: `${product.id}__${unit.id}`,
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrl,
        unitMeasurementId: unit.unitMeasurementId,
        unitName: unit.unitMeasurement?.name ?? 'Unidad',
        price: product.price ?? 0,
      }))
    );
  }, [products]);

  const filteredProductUnitOptions = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return [];
    return productUnitOptions.filter((option) =>
      `${option.productName} ${option.unitName}`.toLowerCase().includes(term)
    );
  }, [productSearch, productUnitOptions]);

  const getUnitsForProduct = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    return product?.productUnits ?? [];
  };

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handleChangeQuantity = (index: number, rawValue: string) => {
    const itemKey = items[index]?.key;
    if (!itemKey) return;
    const cleaned = rawValue.replace(/[^0-9.,]/g, '');
    setQuantityDrafts((prev) => ({ ...prev, [itemKey]: cleaned }));
    if (cleaned.trim() === '') {
      setItems((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index ? { ...item, quantity: 0 } : item
        )
      );
      return;
    }

    const parsed = toNonNegativeNumber(cleaned);
    if (parsed === null) return;

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: parsed } : item
      )
    );
  };

  const handleQuantityBlur = (index: number) => {
    const itemKey = items[index]?.key;
    if (!itemKey) return;

    setQuantityDrafts((prev) => {
      const draftValue = prev[itemKey];
      const next = { ...prev };
      delete next[itemKey];

      if (draftValue === undefined) return next;

      const parsed = toNonNegativeNumber(draftValue);
      setItems((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, quantity: parsed ?? 0 } : item
        )
      );

      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleChangeUnit = (index: number, unitMeasurementId: number) => {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const unit = getUnitsForProduct(item.productId).find(
          (productUnit) => productUnit.unitMeasurement.id === unitMeasurementId
        )?.unitMeasurement;
        return {
          ...item,
          unitMeasurementId,
          unitName: unit?.name ?? item.unitName,
        };
      })
    );
  };

  const handleAddProduct = (selectedKey: string) => {
    const selected = productUnitOptions.find((option) => option.key === selectedKey);
    if (!selected) {
      toast.error('Selecciona un producto valido');
      return;
    }

    const stepQuantity = 0.25;

    setItems((prev) => [
      ...prev,
      {
        key: `new-${selected.productId}-${selected.unitMeasurementId}-${Date.now()}`,
        productId: selected.productId,
        unitMeasurementId: selected.unitMeasurementId,
        productName: selected.productName,
        unitName: selected.unitName,
        quantity: stepQuantity,
        price: selected.price,
        imageUrl: selected.imageUrl,
      },
    ]);

    setProductSearch('');
  };

  const handleSave = async () => {
    const cleanItems = items
      .filter((item) => item.quantity > 0)
      .map<CreateOrderItemDto>((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        unitMeasurementId: item.unitMeasurementId,
      }));

    if (cleanItems.length === 0) {
      toast.error('Debes dejar al menos un producto en el pedido');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        areaId: order.areaId,
        userId: order.userId,
        status: order.status,
        observation,
        totalAmount: totalQuantity,
        orderItems: cleanItems,
      });

      toast.success('Pedido actualizado correctamente');
      router.push('/dashboard/orders');
    } catch (saveError) {
      console.error('[EditOrderPage] Error updating order', saveError);
      toast.error('No se pudo actualizar el pedido');
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Editar pedido #{order.id}</h1>
          <p className='text-sm text-muted-foreground'>
            Cliente: {order.User?.firstName} {order.User?.lastName} | Fecha: {formatDate(order.createdAt)}
          </p>
        </div>
        <Button variant='outline' onClick={() => router.push('/dashboard/orders')} className='w-full sm:w-auto'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar productos</CardTitle>
          <CardDescription>Busca por producto o unidad y agrega con un clic</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Input
            type='text'
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder='Buscar producto o unidad'
          />
          <div className='max-h-56 overflow-y-auto rounded-md border bg-white'>
            {productSearch.trim().length === 0 ? (
              <p className='px-3 py-2 text-xs text-slate-500'>Escribe para buscar productos</p>
            ) : filteredProductUnitOptions.length === 0 ? (
              <p className='px-3 py-2 text-xs text-slate-500'>Sin resultados</p>
            ) : (
              filteredProductUnitOptions.map((option) => (
                <button
                  key={option.key}
                  type='button'
                  onClick={() => handleAddProduct(option.key)}
                  className='flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0'
                >
                  <span>{option.productName} - {option.unitName}</span>
                  <span className='text-xs font-semibold text-blue-700'>Agregar</span>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos del pedido</CardTitle>
          <CardDescription>Modifica cantidades o elimina productos</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay productos en el pedido.</p>
          ) : (
            <div className='space-y-3'>
              {items.map((item, index) => (
                <div key={item.key} className='border rounded-lg p-3'>
                  <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                    <div className='flex items-center gap-3'>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          width={52}
                          height={52}
                          className='h-12 w-12 rounded-md object-cover border'
                        />
                      ) : (
                        <div className='h-12 w-12 rounded-md border bg-muted' />
                      )}
                      <div>
                      <p className='font-medium'>{item.productName}</p>
                      <p className='text-xs text-muted-foreground'>
                        Unidad: {item.unitName}
                      </p>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-[180px_140px_160px] gap-2 w-full md:w-auto'>
                      <Select
                        value={item.unitMeasurementId.toString()}
                        onValueChange={(value) => handleChangeUnit(index, Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Unidad' />
                        </SelectTrigger>
                        <SelectContent>
                          {getUnitsForProduct(item.productId).map((unit) => (
                            <SelectItem key={unit.id} value={unit.unitMeasurement.id.toString()}>
                              {unit.unitMeasurement.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type='text'
                        inputMode='decimal'
                        pattern='^\\d*(?:[\\.,]\\d+)?$'
                        value={quantityDrafts[item.key] ?? String(item.quantity)}
                        onChange={(event) => handleChangeQuantity(index, event.target.value)}
                        onBlur={() => handleQuantityBlur(index)}
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>Total de cantidad</p>
            <p className='text-2xl font-bold'>{totalQuantity.toLocaleString('es-ES')}</p>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className='w-full sm:w-auto'>
            {updateMutation.isPending ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : null}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observacion</CardTitle>
          <CardDescription>Edita la observacion del pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder='Escribe una observacion para el pedido'
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = useMemo(() => Number(params?.id), [params?.id]);

  const { data: order, isLoading, error } = useOrderQuery(Number.isFinite(orderId) ? orderId : null);

  if (!Number.isFinite(orderId)) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='pt-6'>ID de pedido invalido.</CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='p-6 flex justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='pt-6'>No se pudo cargar el pedido.</CardContent>
        </Card>
      </div>
    );
  }

  return <EditOrderForm key={order.id} order={order} />;
}
