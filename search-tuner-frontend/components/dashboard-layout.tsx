"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { StatusBar } from "@/components/status-bar"
import { Separator } from "@/components/ui/separator"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function DashboardLayout({
  children,
  title,
  description,
  actions,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex flex-col">
              {title && (
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 overflow-auto bg-background p-4">
          {children}
        </main>
        <StatusBar />
      </SidebarInset>
    </SidebarProvider>
  )
}
