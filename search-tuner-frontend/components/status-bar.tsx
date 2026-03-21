"use client"

import { cn } from "@/lib/utils"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface StatusBarProps {
  className?: string
}

export function StatusBar({ className }: StatusBarProps) {
  const { data, error } = useSWR("/api/status", fetcher, {
    refreshInterval: 10000,
  })

  const esConnected = data?.connected ?? false
  const docsCount = data?.docsCount ?? 0
  const mysqlConnected = data?.mysqlConnected ?? false

  return (
    <div
      className={cn(
        "flex h-8 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Elasticsearch:</span>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                esConnected ? "bg-success" : "bg-destructive"
              )}
            />
            <span className={esConnected ? "text-success" : "text-destructive"}>
              {error ? "Error" : esConnected ? "Connected" : "Disconnected"}
            </span>
          </span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span>MySQL:</span>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                mysqlConnected ? "bg-success" : "bg-destructive"
              )}
            />
            <span className={mysqlConnected ? "text-success" : "text-destructive"}>
              {mysqlConnected ? "Connected" : "Disconnected"}
            </span>
          </span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div>
          Docs: <span className="font-medium text-foreground">{docsCount.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-muted-foreground/60">
        Backend: <span className="font-mono">localhost:8080</span>
      </div>
    </div>
  )
}
