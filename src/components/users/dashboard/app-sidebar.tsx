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
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
