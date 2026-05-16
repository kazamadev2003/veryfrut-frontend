"use client"
import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/users/dashboard/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
   
    <>
    <SidebarProvider>
        <AppSidebar />
             <SidebarInset className="m-2 rounded-xl border border-gray-200 overflow-hidden bg-white">
               {children}
             </SidebarInset>
    </SidebarProvider>
    </>
  )
}
