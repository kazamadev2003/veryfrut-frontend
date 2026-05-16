'use client';

import { useMemo, useState } from 'react';
import { Order } from '@/types/order';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateExcelReport } from '@/lib/utils/excel-report';
import { useCategoriesQuery, useOrdersByDateRangeQuery } from '@/lib/api';
import { useOrdersByDay } from '@/lib/api/hooks/use-orders-by-day';
import { Loader2, Download } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function ReportDialog({ open, onOpenChange, orders }: ReportDialogProps) {
  void orders;
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'range' | 'specific'>('range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [specificDate, setSpecificDate] = useState('');

  const hasStartAndEnd = Boolean(startDate && endDate);
  const isRangeValid = hasStartAndEnd && startDate <= endDate;
  const isSpecificValid = Boolean(specificDate);

  const { data: specificOrdersData = [], isLoading: isSpecificLoading } = useOrdersByDay(
    mode === 'specific' && isSpecificValid ? specificDate : null,
    mode === 'specific' && isSpecificValid && open
  );

  const { data: rangeOrdersData = [], isLoading: isRangeLoading } = useOrdersByDateRangeQuery(
    mode === 'range' && isRangeValid ? startDate : null,
    mode === 'range' && isRangeValid ? endDate : null
  );

  const { data: categoriesData = [] } = useCategoriesQuery();

  const filteredOrders = (() => {
    if (mode === 'specific') {
      if (!isSpecificValid) return [];
      return specificOrdersData;
    }
    if (!isRangeValid) return [];
    return rangeOrdersData;
  })();

  const dateRangeLabel = useMemo(() => {
    if (mode === 'specific') return specificDate || '';
    if (!isRangeValid) return '';
    if (startDate === endDate) return startDate;
    return `${startDate} al ${endDate}`;
  }, [endDate, isRangeValid, mode, specificDate, startDate]);

  const previewData = {
    totalOrders: filteredOrders.length,
    totalProducts: new Set(
      filteredOrders.flatMap((o) => o.orderItems?.map((i) => i.productId) || [])
    ).size,
    totalAreas: new Set(filteredOrders.map((o) => o.areaId)).size,
    totalQuantity: filteredOrders.reduce(
      (sum, o) =>
        sum +
        (o.orderItems?.reduce((s, i) => s + (i.quantity || 0), 0) || 0),
      0
    ),
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setStartDate('');
    setEndDate('');
    setSpecificDate('');
    setMode('range');
  };

  const handleGenerateReport = async () => {
    const canGenerate = mode === 'specific' ? isSpecificValid : isRangeValid;
    if (!canGenerate || filteredOrders.length === 0) return;

    setIsGenerating(true);
    try {
      const excelStartDate = mode === 'specific' ? specificDate : startDate;
      const excelEndDate = mode === 'specific' ? specificDate : endDate;
      await generateExcelReport(
        filteredOrders,
        excelStartDate,
        excelEndDate,
        dateRangeLabel,
        categoriesData
      );
      resetAndClose();
    } catch (error) {
      console.error('[ReportDialog] Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Generar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Descarga un Excel por rango de fechas.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-2'>
            <Button
              type='button'
              variant={mode === 'specific' ? 'default' : 'outline'}
              onClick={() => setMode('specific')}
            >
              Fecha especifica
            </Button>
            <Button
              type='button'
              variant={mode === 'range' ? 'default' : 'outline'}
              onClick={() => setMode('range')}
            >
              Rango de fechas
            </Button>
          </div>

          {mode === 'specific' ? (
            <div>
              <label className='text-sm font-medium'>Fecha especifica</label>
              <input
                type='date'
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className='w-full px-3 py-2 border rounded-md text-sm mt-2'
              />
            </div>
          ) : (
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium'>Fecha inicio</label>
                <input
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md text-sm mt-2'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Fecha fin</label>
                <input
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md text-sm mt-2'
                />
              </div>
              {hasStartAndEnd && !isRangeValid && (
                <p className='text-xs text-red-600'>La fecha fin debe ser mayor o igual a la fecha inicio.</p>
              )}
            </div>
          )}

          {dateRangeLabel && (
            <p className='text-xs text-muted-foreground'>
              Seleccion actual: {dateRangeLabel}
            </p>
          )}
          {!dateRangeLabel && (
            <p className='text-xs text-muted-foreground'>Selecciona una fecha para continuar.</p>
          )}
          
          <div className='grid grid-cols-2 gap-2'>
            <div className='bg-blue-50 p-2 rounded-lg border border-blue-200'>
              <p className='text-xs text-muted-foreground'>Ordenes</p>
              <p className='text-xl font-bold text-blue-600'>{previewData.totalOrders}</p>
            </div>
            <div className='bg-purple-50 p-2 rounded-lg border border-purple-200'>
              <p className='text-xs text-muted-foreground'>Productos</p>
              <p className='text-xl font-bold text-purple-600'>{previewData.totalProducts}</p>
            </div>
            <div className='bg-green-50 p-2 rounded-lg border border-green-200'>
              <p className='text-xs text-muted-foreground'>Areas</p>
              <p className='text-xl font-bold text-green-600'>{previewData.totalAreas}</p>
            </div>
            <div className='bg-orange-50 p-2 rounded-lg border border-orange-200'>
              <p className='text-xs text-muted-foreground'>Cantidad Total</p>
              <p className='text-xl font-bold text-orange-600'>{previewData.totalQuantity}</p>
            </div>
          </div>

          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <p className='text-xs text-amber-700'>
              El reporte incluira las ordenes del rango seleccionado ({dateRangeLabel || 'sin rango'}).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={resetAndClose}
            disabled={isGenerating || isSpecificLoading || isRangeLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={
              isGenerating ||
              isSpecificLoading ||
              isRangeLoading ||
              (mode === 'specific' ? !isSpecificValid : !isRangeValid) ||
              filteredOrders.length === 0
            }
            className='gap-2'
          >
            {isGenerating || isSpecificLoading || isRangeLoading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                {isGenerating ? 'Generando...' : 'Cargando...'}
              </>
            ) : (
              <>
                <Download className='w-4 h-4' />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
