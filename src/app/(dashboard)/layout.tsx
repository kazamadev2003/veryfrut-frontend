import React from "react"
import { AppSidebar } from "@/components/dashboard/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
            <AppSidebar />
                 <SidebarInset className="m-2 rounded-xl border border-gray-200 overflow-hidden bg-white">
                   {children}
                 </SidebarInset>
    </SidebarProvider>
  )
}
