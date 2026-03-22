"use client"

import {
  Search,
  BookOpen,
  Wrench,
  BarChart3,
  Database,
  Settings,
  Zap,
  ShoppingBag,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Search Test",
    url: "/search",
    icon: Search,
    description: "검색 테스트",
  },
  {
    title: "Synonyms",
    url: "/synonyms",
    icon: BookOpen,
    description: "동의어 관리",
  },
  {
    title: "Analyzer",
    url: "/analyzer",
    icon: Wrench,
    description: "분석기 설정",
  },
  {
    title: "Quality",
    url: "/quality",
    icon: BarChart3,
    description: "품질 평가",
  },
  {
    title: "Data",
    url: "/data",
    icon: Database,
    description: "데이터 관리",
  },
  {
    title: "Admin",
    url: "/admin",
    icon: ShoppingBag,
    description: "상품 관리",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Korean Search Tuner
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Elasticsearch Tuning
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
