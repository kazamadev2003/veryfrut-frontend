import { Order } from '@/types/order';
import type * as ExcelJS from 'exceljs';

interface Category {
  id: number;
  name: string;
}

const hexToArgb = (hex: string): string => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  return ('FF' + cleanHex).toUpperCase();
};

interface CompanyData {
  id: number;
  name: string;
  color: string;
  areas: Map<number, { id: number; name: string; color: string }>;
}

interface CategoryProduct {
  product: {
    id: number;
    name: string;
    category?: { id: number; name: string };
  };
  quantitiesByCompany: Map<
    number,
    Array<{
      quantity: number;
      unitName: string;
      areaId: number;
      areaName: string;
      areaColor: string;
      dateKey: string;
      entryKey: string;
    }>
  >;
}

const toDateKey = (value?: string): string => {
  if (!value) return '';
  return value.slice(0, 10);
};

const generateExcelReport = async (
  orders: Order[],
  startDate?: string,
  endDate?: string,
  dateRangeStr?: string,
  categoriesData?: Category[]
): Promise<void> => {
  void categoriesData;
  console.log('[v0] generateExcelReport - Total orders received:', orders.length);
  console.log('[v0] Orders with observations:', orders.filter(o => o.observation && o.observation !== null).map(o => ({ id: o.id, observation: o.observation })));
  
  const finalDateRangeStr = dateRangeStr || (startDate || endDate 
    ? `${startDate || 'inicio'} al ${endDate || 'fin'}` 
    : 'Todas las fechas');
  const isRangeMode = Boolean(startDate && endDate && startDate !== endDate);
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte de Productos');
  const observationFillArgb = 'FFFFFF99';
  const categoryRowHeight = 28;
  const observationRowHeight = 56;
  const observationFontSize = 18;

  // Agrupar por company
  const companiesMap = new Map<number, CompanyData>();
  const productsGroupedByCategory = new Map<string, Map<number, CategoryProduct>>();

  // Procesar órdenes
  orders.forEach((order) => {
    if (!order.area || !order.area.company) return;
    const orderDateKey = toDateKey(order.createdAt);

    const company = order.area.company;
    const area = order.area;

    // Guardar company
    if (!companiesMap.has(company.id)) {
      companiesMap.set(company.id, {
        id: company.id,
        name: company.name,
        color: (company as { id: number; name: string; color?: string }).color || '#000000',
        areas: new Map(),
      });
    }

    const companyData = companiesMap.get(company.id)!;
    if (!companyData.areas.has(area.id)) {
      companyData.areas.set(area.id, {
        id: area.id,
        name: area.name,
        color: area.color || '#000000',
      });
    }

    // Procesar items de orden
    order.orderItems?.forEach((item, itemIndex) => {
      if (!item.product) return;
      const itemDateKey = toDateKey(item.createdAt) || orderDateKey;
      const stableItemId =
        item.id !== null && item.id !== undefined ? String(item.id) : `idx-${itemIndex}`;
      const entryKey = `${order.id}-${stableItemId}`;

      const product = item.product;
      const categoryName = product.category?.name || 'Sin Categoría';
      const unitName = item.unitMeasurement?.name || 'und';

      if (!productsGroupedByCategory.has(categoryName)) {
        productsGroupedByCategory.set(categoryName, new Map());
      }

      const categoryMap = productsGroupedByCategory.get(categoryName)!;
      if (!categoryMap.has(product.id)) {
        categoryMap.set(product.id, {
          product: {
            id: product.id,
            name: product.name,
            category: product.category,
          },
          quantitiesByCompany: new Map(),
        });
      }

      const productEntry = categoryMap.get(product.id)!;
      if (!productEntry.quantitiesByCompany.has(company.id)) {
        productEntry.quantitiesByCompany.set(company.id, []);
      }

      productEntry.quantitiesByCompany.get(company.id)!.push({
        quantity: item.quantity || 0,
        unitName,
        areaId: area.id,
        areaName: area.name,
        areaColor: area.color || '#000000',
        dateKey: itemDateKey,
        entryKey,
      });
    });
  });

  // Ordenar companies por ID en orden ascendente
  const companies = Array.from(companiesMap.values()).sort((a, b) => a.id - b.id);

  // Fila 1 - Título
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `Fecha: ${finalDateRangeStr}`;
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

  const renderCompanyHeaderRow = (row: number, includeProductsHeader = false) => {
    worksheet.getRow(row).height = categoryRowHeight;
    const headerCell = worksheet.getCell(row, 1);
    headerCell.value = includeProductsHeader ? 'Productos' : '';
    headerCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: includeProductsHeader ? 'FF666666' : 'FFFFFFFF' },
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    companies.forEach((company, colIndex) => {
      const cell = worksheet.getCell(row, colIndex + 2);
      cell.value = company.name.toUpperCase();
      cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(company.color) } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  };

  // Iniciar en la fila 2, sin encabezado global de "Productos"
  let currentRow = 2;

  // Agrupar observaciones por company ANTES de iterar categorías
  const observationsByCompany = new Map<number, string[]>();
  
  orders.forEach((order) => {
    if (!order.area || !order.area.company) return;
    const companyId = order.area.company.id;
    
    // Verificar que observation no sea null ni undefined
    if (order.observation && typeof order.observation === 'string' && order.observation.trim().length > 0) {
      if (!observationsByCompany.has(companyId)) {
        observationsByCompany.set(companyId, []);
      }
      observationsByCompany.get(companyId)!.push(order.observation.trim());
      console.log('[v0] Observation added for company', companyId, ':', order.observation);
    }
  });
  
  console.log('[v0] Total observations by company:', observationsByCompany.size, observationsByCompany);

  // Crear orden deseado de categorías basado en el array recibido
  // Orden: Verduras, Frutas, Hierbas, Igv, Otros (y cualquier otra que venga en el backend)
  const desiredCategoryOrder = ['Verduras', 'Frutas', 'Hierbas', 'Igv', 'Otros'];
  
  const sortedCategoryEntries = Array.from(productsGroupedByCategory.entries());

  // Ordenar categorías: primero las del array deseado en ese orden, luego el resto alfabéticamente
  sortedCategoryEntries.sort((a, b) => {
    const indexA = desiredCategoryOrder.indexOf(a[0]);
    const indexB = desiredCategoryOrder.indexOf(b[0]);
    
    // Si ambas están en el array deseado, usar ese orden
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // Si solo una está en el array deseado, esa va primero
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // Si ninguna está en el array deseado, ordenar alfabéticamente
    return a[0].localeCompare(b[0]);
  });

  // Iterar por categorías en orden
  sortedCategoryEntries.forEach(([categoryName, productsMap]) => {
    // Encabezado de empresas desde la primera categoría
    renderCompanyHeaderRow(currentRow);

    // Fila de categoría - TÍTULO CON TAMAÑO 16 Y NEGRITA
    const categoryCell = worksheet.getCell(currentRow, 1);
    worksheet.getRow(currentRow).height = categoryRowHeight;
    categoryCell.value = categoryName.toUpperCase();
    categoryCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
    categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    categoryCell.alignment = { horizontal: 'left', vertical: 'middle' };

    currentRow++;

    // Productos de la categoría - ORDENADOS A-Z POR NOMBRE
    const sortedProducts = Array.from(productsMap.values()).sort((a, b) => {
      if (!a.product || !b.product) return 0;
      return (a.product.name || '').localeCompare(b.product.name || '', 'es-ES', { sensitivity: 'base' });
    });

    // Guardar índice de inicio para calcular totales
    sortedProducts.forEach(({ product, quantitiesByCompany }) => {
      if (!product) return;

      const prodCell = worksheet.getCell(currentRow, 1);
      prodCell.value = product.name;
      // Productos: tamaño 16, SIN NEGRITA
      prodCell.font = { name: 'Calibri', size: 16, bold: false, color: { argb: 'FF000000' } };
      prodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      prodCell.alignment = { horizontal: 'left', vertical: 'middle' };
      prodCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // Mostrar cantidades por company
      companies.forEach((company, colIndex) => {
        const cell = worksheet.getCell(currentRow, colIndex + 2);
        const quantities = quantitiesByCompany.get(company.id);

        if (quantities && quantities.length > 0) {
          // Agrupar cantidades por área y unidad
          const groupedByAreaAndUnit = new Map<
            string,
            {
              quantity: number;
              unitName: string;
              areaName: string;
              areaColor: string;
              dateKey: string;
              entryKey: string;
            }
          >();

          quantities.forEach((q) => {
            const key = isRangeMode
              ? `${q.areaId}__${q.unitName}__${q.dateKey || 'no-date'}__${q.entryKey}`
              : `${q.areaId}__${q.unitName}__${q.entryKey}`;
            const current = groupedByAreaAndUnit.get(key);
            if (current) {
              current.quantity += q.quantity;
              return;
            }
            groupedByAreaAndUnit.set(key, {
              quantity: q.quantity,
              unitName: q.unitName,
              areaName: q.areaName,
              areaColor: q.areaColor,
              dateKey: q.dateKey,
              entryKey: q.entryKey,
            });
          });

          const groups = Array.from(groupedByAreaAndUnit.values()).sort((a, b) => {
            const areaNameCmp = a.areaName.localeCompare(b.areaName, 'es-ES', { sensitivity: 'base' });
            if (areaNameCmp !== 0) return areaNameCmp;
            const unitCmp = a.unitName.localeCompare(b.unitName, 'es-ES', { sensitivity: 'base' });
            if (unitCmp !== 0) return unitCmp;
            if (!isRangeMode) return 0;
            return (a.dateKey || '').localeCompare(b.dateKey || '');
          });

          const richText: ExcelJS.RichText[] = groups.flatMap((g, idx) => {
            const parts: ExcelJS.RichText[] = [];
            if (idx > 0) {
              parts.push({
                text: ' + ',
                font: { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } },
              });
            }
            parts.push({
              text: `${g.quantity}${g.unitName}`,
              font: { name: 'Calibri', size: 16, bold: true, color: { argb: hexToArgb(g.areaColor) } },
            });
            return parts;
          });

          const richTextValue: ExcelJS.CellRichTextValue = { richText };
          cell.value = richTextValue;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        } else {
          cell.value = '';
          cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }

        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      currentRow++;
    });

    // Fila de TOTAL para la categoría - Sin unidad de medida
    const totalCell = worksheet.getCell(currentRow, 1);
    totalCell.value = 'TOTAL';
    totalCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
    totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };
    totalCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Calcular totales por company
    // Regla: contar 1 por celda con datos (producto x company),
    // aunque dentro de la celda existan varias cantidades.
    companies.forEach((company, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 2);

      let totalCellsWithData = 0;
      sortedProducts.forEach(({ quantitiesByCompany }) => {
        const quantities = quantitiesByCompany.get(company.id) || [];
        if (quantities.length > 0) totalCellsWithData += 1;
      });

      cell.value = totalCellsWithData > 0 ? totalCellsWithData : '';
      // Total: tamaño 16, CON NEGRITA, sin unidad de medida
      cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    currentRow++;

    // Fila en blanco para separar categorías
    currentRow++;
  });

  // Espacio en blanco
  currentRow += 1;

  // Fila de observaciones
  const obsHeaderCell = worksheet.getCell(currentRow, 1);
  obsHeaderCell.value = 'OBSERVACIONES';
  obsHeaderCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  obsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } };
  obsHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Headers de observaciones por company
  companies.forEach((company, colIndex) => {
    const cell = worksheet.getCell(currentRow, colIndex + 2);
    cell.value = company.name.toUpperCase();
    cell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hexToArgb(company.color) } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  currentRow++;

  // Mostrar observaciones por company
  const maxObsCount = Math.max(
    ...Array.from(observationsByCompany.values()).map((obs) => obs.length),
    0
  );

  for (let obsIndex = 0; obsIndex < maxObsCount; obsIndex++) {
    companies.forEach((company, colIndex) => {
      const cell = worksheet.getCell(currentRow, colIndex + 2);
      const companyObs = observationsByCompany.get(company.id) || [];
      
      if (obsIndex < companyObs.length) {
        cell.value = `• ${companyObs[obsIndex]}`;
        cell.font = { name: 'Calibri', size: observationFontSize, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: observationFillArgb } };
      } else {
        cell.value = '';
        cell.font = { name: 'Calibri', size: observationFontSize, bold: true, color: { argb: 'FF000000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: observationFillArgb } };
      }
      
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    worksheet.getRow(currentRow).height = observationRowHeight;
    currentRow++;
  }

  // Ajustar ancho de columnas
  worksheet.columns = [
    { width: 35 },
    ...companies.map(() => ({ width: 30 })),
  ];

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-productos-${startDate || 'inicio'}-${endDate || 'fin'}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export { generateExcelReport };

