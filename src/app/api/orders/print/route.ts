import { NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface PrintOrderItem {
  productName: string
  quantity: number
  unitName: string
}

interface PrintOrderPayload {
  areaName: string
  createdAt?: string
  observation?: string
  items: PrintOrderItem[]
}

const PERU_TIME_ZONE = "America/Lima"
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

function formatPdfDate(dateValue?: string): string {
  if (!dateValue) {
    return peruDateTimeFormatter.format(new Date())
  }

  // If backend date comes as "YYYY-MM-DD HH:mm:ss", treat it as Peru local time (no UTC conversion).
  const peruLocalMatch = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  )
  if (peruLocalMatch) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = peruLocalMatch
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return peruDateTimeFormatter.format(new Date())
  }

  return peruDateTimeFormatter.format(parsed)
}

function formatQuantity(quantity: number): string {
  if (quantity % 1 === 0) return quantity.toFixed(0)
  return Number.parseFloat(quantity.toFixed(3)).toString().replace(".", ",")
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PrintOrderPayload
    const areaName = body?.areaName?.trim()
    const createdAt = body?.createdAt?.trim()
    const observation = (body?.observation || "").trim()
    const items = Array.isArray(body?.items) ? body.items : []

    if (!areaName || items.length === 0) {
      return NextResponse.json({ message: "Invalid print payload" }, { status: 400 })
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 12
    const contentWidth = pageWidth - margin * 2
    const topLimit = margin
    const bottomLimit = pageHeight - margin

    const colProductWidth = contentWidth * 0.58
    const colQuantityWidth = contentWidth * 0.18
    const colUnitWidth = contentWidth * 0.24

    let cursorY = topLimit

    const drawHeader = () => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("Pedido de Carrito", margin, cursorY)

      cursorY += 7
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Area: ${areaName}`, margin, cursorY)
      cursorY += 5
      doc.text(`Fecha: ${formatPdfDate(createdAt)}`, margin, cursorY)
      cursorY += 6
    }

    const drawTableHeader = () => {
      doc.setFillColor(243, 244, 246)
      doc.rect(margin, cursorY, contentWidth, 8, "F")

      doc.setDrawColor(209, 213, 219)
      doc.rect(margin, cursorY, colProductWidth, 8)
      doc.rect(margin + colProductWidth, cursorY, colQuantityWidth, 8)
      doc.rect(margin + colProductWidth + colQuantityWidth, cursorY, colUnitWidth, 8)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("Producto", margin + 2, cursorY + 5.5)
      doc.text("Cantidad", margin + colProductWidth + 2, cursorY + 5.5)
      doc.text("Unidad de medida", margin + colProductWidth + colQuantityWidth + 2, cursorY + 5.5)
      cursorY += 8
    }

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY + requiredHeight <= bottomLimit) return
      doc.addPage()
      cursorY = topLimit
      drawHeader()
      drawTableHeader()
    }

    drawHeader()
    drawTableHeader()

    for (const item of items) {
      const productName = item.productName?.trim() || "-"
      const quantity = formatQuantity(Number(item.quantity) || 0)
      const unitName = item.unitName?.trim() || "Unidad"

      const productLines = doc.splitTextToSize(productName, colProductWidth - 4)
      const quantityLines = doc.splitTextToSize(quantity, colQuantityWidth - 4)
      const unitLines = doc.splitTextToSize(unitName, colUnitWidth - 4)

      const maxLines = Math.max(productLines.length, quantityLines.length, unitLines.length, 1)
      const rowHeight = Math.max(8, maxLines * 5 + 3)

      ensureSpace(rowHeight)

      doc.setDrawColor(209, 213, 219)
      doc.rect(margin, cursorY, colProductWidth, rowHeight)
      doc.rect(margin + colProductWidth, cursorY, colQuantityWidth, rowHeight)
      doc.rect(margin + colProductWidth + colQuantityWidth, cursorY, colUnitWidth, rowHeight)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(productLines, margin + 2, cursorY + 5)
      doc.text(quantityLines, margin + colProductWidth + 2, cursorY + 5)
      doc.text(unitLines, margin + colProductWidth + colQuantityWidth + 2, cursorY + 5)

      cursorY += rowHeight
    }

    if (observation) {
      const obsLines = doc.splitTextToSize(`Observaciones: ${observation}`, contentWidth - 6)
      const obsHeight = Math.max(10, obsLines.length * 5 + 4)
      ensureSpace(obsHeight + 4)
      cursorY += 4

      doc.setFillColor(249, 250, 251)
      doc.setDrawColor(229, 231, 235)
      doc.rect(margin, cursorY, contentWidth, obsHeight, "FD")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(obsLines, margin + 3, cursorY + 5)
    }

    const pdfArrayBuffer = doc.output("arraybuffer")

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="pedido-carrito.pdf"',
      },
    })
  } catch (error) {
    console.error("[print-order] Error generating pdf:", error)
    return NextResponse.json({ message: "Error generating print document" }, { status: 500 })
  }
}
