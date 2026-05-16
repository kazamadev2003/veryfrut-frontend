'use client'

import { useMemo, useState } from 'react'
import { BarChart3, Boxes, ShoppingCart, TrendingUp, Trophy, UserRound } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDashboardQuery } from '@/lib/api/hooks/useDashboard'
import type { GetDashboardParams } from '@/types/dashboard'

const RANGES: Array<{ label: string; value: NonNullable<GetDashboardParams['dateRange']> }> = [
  { label: 'Hoy', value: 'today' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Ano', value: 'year' },
]

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<NonNullable<GetDashboardParams['dateRange']>>('week')

  const { data, isLoading, error } = useDashboardQuery({
    dateRange,
    limit: 10,
  })

  const totals = useMemo(
    () =>
      data?.totals ?? {
        products: 0,
        orders: 0,
        sales: 0,
      },
    [data?.totals],
  )

  const ordersChart = useMemo(() => {
    const points = data?.analytics?.recentOrders ?? []
    const maxCount = Math.max(1, ...points.map((p) => p.count))
    const maxTotal = Math.max(1, ...points.map((p) => p.total))
    return { points, maxCount, maxTotal }
  }, [data?.analytics?.recentOrders])

  return (
    <div className="flex flex-col gap-6 bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-6 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            {RANGES.map((range) => (
              <Button
                key={range.value}
                variant={dateRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 bg-background">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error cargando dashboard</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Resumen General</h2>
          <p className="text-sm text-muted-foreground">Datos consolidados por rango de fecha seleccionado.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productos</CardTitle>
              <Boxes className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totals.products}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ordenes</CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totals.orders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ventas</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : totals.sales}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Grafica de ordenes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : ordersChart.points.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos para graficar.</p>
              ) : (
                <div className="space-y-3">
                  {ordersChart.points.map((item) => (
                    <div key={`${item.date}-${item.count}`} className="space-y-2 border rounded-md px-3 py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.date}</span>
                        <span className="text-muted-foreground">
                          {item.count} ordenes | Total: {item.total}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${(item.count / ordersChart.maxCount) * 100}%` }}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${(item.total / ordersChart.maxTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
                      Cantidad de ordenes
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
                      Total vendido
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (data?.topProducts?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin productos destacados.</p>
              ) : (
                data?.topProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <Badge variant="secondary">{item.quantityOrdered}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="w-4 h-4" />
                Top Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (data?.topUsers?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Sin usuarios destacados.</p>
              ) : (
                data?.topUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.firstName} {item.lastName}</p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </div>
                    <Badge>{item.orderCount}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ultimos Registros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">Usuarios</p>
                <div className="space-y-2">
                  {(data?.latestUsers ?? []).slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm border rounded-md px-3 py-2">
                      <p className="font-medium">{item.firstName} {item.lastName}</p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </div>
                  ))}
                  {!isLoading && (data?.latestUsers?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">Sin usuarios recientes.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">Productos</p>
                <div className="space-y-2">
                  {(data?.latestProducts ?? []).slice(0, 3).map((item) => (
                    <div key={item.id} className="text-sm border rounded-md px-3 py-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.createdAt}</p>
                    </div>
                  ))}
                  {!isLoading && (data?.latestProducts?.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground">Sin productos recientes.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
