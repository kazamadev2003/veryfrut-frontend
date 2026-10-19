"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Building2, CalendarDays, CheckCircle2, ClipboardList, Clock3, Loader2, XCircle } from "lucide-react"
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

function formatTime(value?: string): string {
  const match = value?.match(/(?:T| )(\d{2}:\d{2})/)
  return match ? match[1] : "-"
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

            <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Estado para {formatDate(date)}</h2><p className="text-sm text-gray-500">Cada tarjeta agrupa las áreas asociadas a un cliente.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{areaRows.length} áreas</span></div>
              <div className="grid gap-4 xl:grid-cols-2">
                {data?.users.map((user) => (
                  <article key={user.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center gap-3 border-b bg-gray-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                      <div className="min-w-0"><h3 className="truncate font-semibold text-gray-900">{user.firstName} {user.lastName}</h3><p className="truncate text-xs text-gray-500">{user.email}</p></div>
                    </div>
                    <div className="divide-y">
                      {user.areas.map((area) => {
                        const color = area.color || area.company?.color || "#64748b"
                        return <div key={area.id} className="border-l-4 px-4 py-3" style={{ borderLeftColor: color }}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /><p className="font-medium text-gray-900">{area.name}</p></div><p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Building2 className="h-3.5 w-3.5" />{area.company?.name ?? "Sin empresa"}</p></div>
                            {area.order ? <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"><p className="flex items-center gap-1 font-semibold"><CheckCircle2 className="h-4 w-4" />Pedido #{area.order.id}</p><p className="mt-1 flex items-center gap-1 text-xs"><Clock3 className="h-3.5 w-3.5" />Registrado a las {formatTime(area.order.createdAt)}</p></div> : <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"><span className="flex items-center gap-1"><XCircle className="h-4 w-4" />Sin pedido</span></div>}
                          </div>
                        </div>
                      })}
                      {user.areas.length === 0 && <p className="px-4 py-5 text-sm text-gray-500">No tiene áreas asociadas.</p>}
                    </div>
                  </article>
                ))}
              </div>
              {!data?.users.length && <p className="py-10 text-center text-gray-500">No hay clientes registrados.</p>}
            </section>

            <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b p-4"><CalendarDays className="h-4 w-4 text-blue-600" /><h2 className="font-semibold">Pedidos programados para fechas futuras</h2></div>
              <div className="divide-y">{data?.futureOrders.length ? data.futureOrders.map((order) => <div key={order.id} className="grid gap-2 p-4 text-sm sm:grid-cols-4 sm:items-center"><span className="font-medium">{order.User?.firstName} {order.User?.lastName}</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: order.area?.color || order.area?.company?.color || "#64748b" }} />{order.area?.name ?? `Área ${order.areaId}`}</span><span>{formatDate(order.scheduledFor)}</span><span className="text-blue-700">Creado a las {formatTime(order.createdAt)}</span></div>) : <p className="p-4 text-sm text-gray-500">No hay pedidos futuros programados.</p>}</div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
