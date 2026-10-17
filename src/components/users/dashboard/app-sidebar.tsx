"use client"

import * as React from "react"
import Image from "next/image"
import {
  BarChart3,
  ShoppingCart,
  User,
  Calendar,
  MoreHorizontal,
  LifeBuoy,
  Clock3,
} from "lucide-react"

import { NavUser } from "./nav-user"
import { NavSecondary } from "./nav-secondary"
import { NavMain } from "./nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const data = {
  navMain: [
    {
      title: "Productos",
      url: "/users",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Pedidos - Rápido",
      url: "/users/fast",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Pedidos - Historial",
      url: "/users/history",
      icon: ShoppingCart,
      isActive: false,
    },
    {
      title: "Perfil",
      url: "/users/profile",
      icon: User,
      isActive: false,
    },
  ],
  navPages: [
    {
      title: "Veryfrut",
      url: "#",
      icon: Calendar,
    },
    {
      title: "More",
      url: "#",
      icon: MoreHorizontal,
    },
  ],
  navSecondary: [
    {
      title: "Soporte",
      url: "#",
      icon: LifeBuoy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentTime, setCurrentTime] = React.useState(() => new Date())
  const peruHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Lima",
      hour: "numeric",
      hourCycle: "h23",
    }).format(currentTime),
  )
  const currentPeruTime = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(currentTime)
  const isOrderWindowClosed = peruHour >= 21

  React.useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <Image
                  src="https://res.cloudinary.com/demzflxgq/image/upload/v1770449756/ChatGPT_Image_7_feb_2026_02_25_57_a_ilotbf.svg"
                  alt="Veryfrut"
                  width={32}
                  height={32}
                  unoptimized
                  className="rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Veryfrut</span>
                  <span className="truncate text-xs text-muted-foreground">Orgánico & Fresco</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavMain items={data.navPages} label="Paginas" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <div className="mx-2 mb-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 font-semibold text-green-900">
            <Clock3 className="h-4 w-4" />
            Horario de pedidos
          </div>
          <p className="mt-1 text-green-800">Recibimos pedidos hasta las 9:00 p. m.</p>
          <p className="mt-1 text-xs text-green-700">Hora actual en Perú: {currentPeruTime}</p>
          <p className={`mt-2 text-xs font-semibold ${isOrderWindowClosed ? "text-red-700" : "text-green-700"}`}>
            {isOrderWindowClosed ? "Pedidos cerrados por hoy" : "Pedidos disponibles"}
          </p>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
