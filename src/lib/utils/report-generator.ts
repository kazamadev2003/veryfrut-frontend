import ExcelJS from 'exceljs';
import type { Suplier, Purchase, PurchaseItem } from '@/lib/api/services/suppliers-service';
import unitMeasurementService from '@/lib/api/services/unit-measurement-service';

export interface ReportOptions {
  filename: string;
  suppliers: Suplier[];
  startDate?: Date;
  endDate?: Date;
}

type UnitMeasurementLite = { id: number; name: string };
const PERU_TIME_ZONE = 'America/Lima';
const peruDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PERU_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

async function getUnitMeasurementsMap(): Promise<Map<number, UnitMeasurementLite>> {
  try {
    const units = await unitMeasurementService.getAll();
    const map = new Map<number, UnitMeasurementLite>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  } catch (error) {
    console.error('[report-generator] Error fetching unit measurements:', error);
    return new Map();
  }
}

function getProductName(item: PurchaseItem): string {
  return item.product?.name || item.description || '-';
}

function getUnitName(item: PurchaseItem, unitMeasurementsMap: Map<number, UnitMeasurementLite>): string {
  if (item.unitMeasurement?.abbreviation) return item.unitMeasurement.abbreviation;
  if (item.unitMeasurement?.name) return item.unitMeasurement.name;
  if (typeof item.unitMeasurementId === 'number') {
    return unitMeasurementsMap.get(item.unitMeasurementId)?.name || `Unidad ${item.unitMeasurementId}`;
  }
  return '-';
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) return dateKey;
  return `${day}/${month}/${year}`;
}

function getPurchaseDateKey(purchase: Purchase): string | null {
  const raw = purchase.purchaseDate || purchase.createdAt;
  if (!raw) return null;

  const hasExplicitTimeZone = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(raw);

  // Preserve date only when timestamp has no explicit timezone.
  const localMatch = !hasExplicitTimeZone
    ? raw.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?$/
      )
    : null;
  if (localMatch) {
    const [, year, month, day] = localMatch;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return peruDateKeyFormatter.format(parsed);
}

// FunciÃ³n para generar reporte diario por cliente
export async function generateDailyReportByClient(options: ReportOptions) {
  const { filename, suppliers, startDate, endDate } = options;
  const workbook = new ExcelJS.Workbook();
  const unitMeasurementsMap = await getUnitMeasurementsMap();
  const startKey = startDate ? toDateKey(startDate) : null;
  const endKey = endDate ? toDateKey(endDate) : null;

// Agrupar compras por cliente y por dÃ­a
  const clientData = new Map<number, Map<string, Purchase[]>>();

  suppliers.forEach((supplier) => {
    if (!clientData.has(supplier.id)) {
      clientData.set(supplier.id, new Map());
    }

    const purchases = supplier.purchases || [];
const filteredPurchases = purchases.filter((p: Purchase) => {
      const purchaseDateKey = getPurchaseDateKey(p);
      if (!purchaseDateKey) return false;
      if (startKey && purchaseDateKey < startKey) return false;
      if (endKey && purchaseDateKey > endKey) return false;
      return true;
    });

    filteredPurchases.forEach((purchase: Purchase) => {
      const dateKey = getPurchaseDateKey(purchase);
      if (!dateKey) return;
      const dayMap = clientData.get(supplier.id)!;

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, []);
      }

      dayMap.get(dateKey)!.push(purchase);
    });
  });

  // Crear hoja por cliente
  clientData.forEach((dayMap, supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    const worksheet = workbook.addWorksheet(supplier.name.substring(0, 31));
    worksheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
    };

    let rowNum = 1;
    const titleRow = worksheet.getRow(rowNum);
    titleRow.values = [supplier.name.toUpperCase()];
    titleRow.font = { bold: true, size: 14 };
    rowNum += 2;

    // Headers
    const headerRow = worksheet.getRow(rowNum);
    headerRow.values = ['FECHA', 'PRODUCTO', 'UNIDAD', 'CANTIDAD', 'PRECIO', 'TOTAL'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    rowNum += 1;

    let grandTotal = 0;
    const dateKeys = Array.from(dayMap.keys()).sort((a, b) => a.localeCompare(b));

    dateKeys.forEach((dateKey) => {
      const purchases = dayMap.get(dateKey) || [];
      let dayTotal = 0;

purchases.forEach((purchase: Purchase) => {
        purchase.purchaseItems?.forEach((item: PurchaseItem) => {
          const itemTotal = item.quantity * item.unitCost;
          dayTotal += itemTotal;
          grandTotal += itemTotal;

          const row = worksheet.getRow(rowNum);
          row.values = [
            toDisplayDate(dateKey),
            getProductName(item),
            getUnitName(item, unitMeasurementsMap),
            item.quantity,
            item.unitCost.toFixed(2),
            itemTotal.toFixed(2),
          ];
          row.alignment = { horizontal: 'right' };
          rowNum += 1;
        });
      });

      // Subtotal del dÃ­a
      const subtotalRow = worksheet.getRow(rowNum);
      subtotalRow.values = ['', '', '', '', 'Subtotal:', dayTotal.toFixed(2)];
      subtotalRow.font = { bold: true };
      subtotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
      rowNum += 1;
    });

    rowNum += 1;

    // Total general
    const totalRow = worksheet.getRow(rowNum);
    totalRow.values = ['', '', '', '', 'TOTAL GENERAL:', grandTotal.toFixed(2)];
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    // Ajustar ancho de columnas
    worksheet.columns = [
      { width: 12 },
      { width: 30 },
      { width: 14 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
    ];
  });

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  downloadExcel(buffer, filename);
}

// FunciÃ³n para generar reporte por producto/unidad de medida
export async function generateReportByProductUnit(options: ReportOptions) {
  const { filename, suppliers, startDate, endDate } = options;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte por Producto');
  const unitMeasurementsMap = await getUnitMeasurementsMap();
  const startKey = startDate ? toDateKey(startDate) : null;
  const endKey = endDate ? toDateKey(endDate) : null;

  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
  };

  // Agrupar por fecha y luego por producto para mantener juntos los productos del mismo dia.
  const dateData = new Map<string, Map<string, { quantity: number; total: number }>>();

  suppliers.forEach((supplier) => {
    supplier.purchases?.forEach((purchase: Purchase) => {
      const purchaseDateKey = getPurchaseDateKey(purchase);
      if (!purchaseDateKey) return;
      if (startKey && purchaseDateKey < startKey) return;
      if (endKey && purchaseDateKey > endKey) return;

      purchase.purchaseItems?.forEach((item) => {
        const productName = getProductName(item);
        const unitName = getUnitName(item, unitMeasurementsMap);
        const productKey = `${productName} (${unitName === '-' ? 'Sin unidad' : unitName})`;

        if (!dateData.has(purchaseDateKey)) {
          dateData.set(purchaseDateKey, new Map());
        }

        const productMap = dateData.get(purchaseDateKey)!;

        if (!productMap.has(productKey)) {
          productMap.set(productKey, { quantity: 0, total: 0 });
        }

        const data = productMap.get(productKey)!;
        data.quantity += item.quantity;
        data.total += item.quantity * item.unitCost;
      });
    });
  });

  let rowNum = 1;
  const titleRow = worksheet.getRow(rowNum);
  titleRow.values = ['REPORTE DE PRODUCTOS POR FECHA'];
  titleRow.font = { bold: true, size: 14 };
  rowNum += 2;

  // Headers
  const headerRow = worksheet.getRow(rowNum);
  headerRow.values = ['FECHA', 'PRODUCTO', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' },
  };
  headerRow.alignment = { horizontal: 'center' };
  rowNum += 1;

  let grandTotal = 0;
  const sortedDateKeys = Array.from(dateData.keys()).sort((a, b) => a.localeCompare(b));

  sortedDateKeys.forEach((dateKey) => {
    const productMap = dateData.get(dateKey);
    if (!productMap) return;

    const sortedProducts = Array.from(productMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    let dayTotal = 0;
    let previousProductKey = '';
    let shadedProductCell = false;

    sortedProducts.forEach(([productKey, data]) => {
      const unitPrice = data.quantity > 0 ? data.total / data.quantity : 0;

      const row = worksheet.getRow(rowNum);
      row.values = [toDisplayDate(dateKey), productKey, data.quantity, unitPrice.toFixed(2), data.total.toFixed(2)];
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(5).alignment = { horizontal: 'right' };

      if (productKey !== previousProductKey) {
        shadedProductCell = !shadedProductCell;
        previousProductKey = productKey;
      }

      if (shadedProductCell) {
        row.getCell(2).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' },
        };
      }

      dayTotal += data.total;
      grandTotal += data.total;
      rowNum += 1;
    });

    const daySubtotalRow = worksheet.getRow(rowNum);
    daySubtotalRow.values = ['', `SUBTOTAL ${toDisplayDate(dateKey)}`, '', '', dayTotal.toFixed(2)];
    daySubtotalRow.font = { bold: true };
    daySubtotalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    daySubtotalRow.getCell(2).alignment = { horizontal: 'left' };
    daySubtotalRow.getCell(5).alignment = { horizontal: 'right' };
    rowNum += 1;
  });

  rowNum += 1;

  // Total general
  const totalRow = worksheet.getRow(rowNum);
  totalRow.values = ['', 'TOTAL GENERAL', '', '', grandTotal.toFixed(2)];
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

  // Ajustar ancho de columnas
  worksheet.columns = [
    { width: 12 },
    { width: 25 },
    { width: 12 },
    { width: 15 },
    { width: 12 },
  ];

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  downloadExcel(buffer, filename);
}

// FunciÃ³n auxiliar para descargar Excel
function downloadExcel(buffer: BlobPart, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

