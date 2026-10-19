"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, CheckCircle2, ClipboardList, Loader2, XCircle } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import orderService from "@/lib/api/services/order-service"

function peruToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function formatDate(value?: string): string {
  return value ? value.slice(0, 10).split("-").reverse().join("/") : "-"
}

export default function OrderFollowUpPage() {
  const [date, setDate] = useState(peruToday)
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", "follow-up", date],
    queryFn: () => orderService.getFollowUp(date),
  })

  const areaRows = useMemo(
    () => data?.users.flatMap((user) => user.areas.map((area) => ({ user, area }))) ?? [],
    [data],
  )
  const pendingCount = areaRows.filter(({ area }) => !area.order).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700"><ClipboardList className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Órdenes</p>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Seguimiento de pedidos</h1>
              <p className="text-sm text-gray-500">Revisa qué clientes y áreas aún no registran pedido.</p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <label htmlFor="follow-up-date" className="mb-1 block text-xs font-semibold text-gray-600">Fecha a revisar</label>
            <Input id="follow-up-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </div>
        </div>
      </header>

      <main className="space-y-6 p-4 sm:p-6">
        {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div> : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">No se pudo cargar el seguimiento.</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4"><p className="text-sm text-gray-500">Clientes</p><p className="text-2xl font-bold">{data?.users.length ?? 0}</p></div>
              <div className="rounded-xl border bg-white p-4"><p className="text-sm text-gray-500">Áreas sin pedido</p><p className="text-2xl font-bold text-red-600">{pendingCount}</p></div>
              <div className="rounded-xl border bg-white p-4"><p className="text-sm text-gray-500">Pedidos futuros</p><p className="text-2xl font-bold text-blue-600">{data?.futureOrders.length ?? 0}</p></div>
            </div>

            <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="border-b p-4"><h2 className="font-semibold">Estado para {formatDate(date)}</h2></div>
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y">
                {areaRows.map(({ user, area }) => <tr key={`${user.id}-${area.id}`}><td className="px-4 py-3 font-medium">{user.firstName} {user.lastName}</td><td className="px-4 py-3">{area.name}</td><td className="px-4 py-3">{area.company?.name ?? "-"}</td><td className="px-4 py-3">{area.order ? <span className="inline-flex items-center gap-1 font-medium text-green-700"><CheckCircle2 className="h-4 w-4" /> Pedido #{area.order.id} ({area.order.status})</span> : <span className="inline-flex items-center gap-1 font-medium text-red-600"><XCircle className="h-4 w-4" /> Sin pedido</span>}</td></tr>)}
                {areaRows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No hay áreas asociadas a clientes.</td></tr>}
              </tbody></table></div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b p-4"><CalendarDays className="h-4 w-4 text-blue-600" /><h2 className="font-semibold">Pedidos programados para fechas futuras</h2></div>
              <div className="divide-y">{data?.futureOrders.length ? data.futureOrders.map((order) => <div key={order.id} className="grid gap-1 p-4 text-sm sm:grid-cols-4"><span className="font-medium">{order.User?.firstName} {order.User?.lastName}</span><span>{order.area?.name ?? `Área ${order.areaId}`}</span><span>{formatDate(order.scheduledFor)}</span><span className="text-blue-700">{order.status}</span></div>) : <p className="p-4 text-sm text-gray-500">No hay pedidos futuros programados.</p>}</div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
