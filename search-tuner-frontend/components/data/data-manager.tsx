"use client"

import { useState } from "react"
import { Database, HardDrive, Clock, FileText, RefreshCw, ExternalLink, Settings, Loader2, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import useSWR from "swr"

interface DataStatus {
  mysql: {
    stores: number
    products: number
  }
  elasticsearch: {
    index: string
    alias: string
    docs: number
    size: string
    status: "green" | "yellow" | "red"
  }
  indexConfig: {
    analyzer: string
    features: string[]
    synonymGroups: number
    lastUpdated: string
  }
  history: {
    time: string
    type: string
    docs: number | null
    duration: string
  }[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DataManager() {
  const [isReindexing, setIsReindexing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<DataStatus>("/api/index", fetcher)

  const handleReindex = async () => {
    setIsReindexing(true)
    try {
      const response = await fetch("/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reindex" }),
      })

      if (!response.ok) {
        throw new Error("Reindex failed")
      }

      await mutate()
    } catch (err) {
      console.error("Reindex error:", err)
    } finally {
      setIsReindexing(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      await mutate()
    } catch (err) {
      console.error("Sync error:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">데이터 상태 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="mt-4 text-sm text-destructive">데이터 상태를 불러오는데 실패했습니다</p>
            <p className="text-xs text-muted-foreground mt-1">백엔드 서버 연결을 확인하세요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No data state
  if (!data || !data.mysql || !data.elasticsearch || !data.indexConfig) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Info className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">데이터 없음</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              백엔드 서버에 연결되지 않았습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* MySQL Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              MySQL
            </CardTitle>
            <CardDescription>데이터베이스 상태</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="text-xs text-muted-foreground">가게</div>
                <div className="mt-1 text-2xl font-bold">{data.mysql.stores.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <div className="text-xs text-muted-foreground">상품</div>
                <div className="mt-1 text-2xl font-bold">{data.mysql.products.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                상품 목록 보기
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <FileText className="h-4 w-4 mr-1" />
                가게 목록 보기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Elasticsearch Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary" />
              Elasticsearch
            </CardTitle>
            <CardDescription>색인 상태</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Index</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">{data.elasticsearch.index}</code>
                  <Badge variant="outline" className="text-[10px]">alias: {data.elasticsearch.alias}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents</span>
                <span className="text-sm font-medium">{data.elasticsearch.docs.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">{data.elasticsearch.size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={cn(
                  "border",
                  data.elasticsearch.status === "green" && "bg-success/20 text-success border-success/30",
                  data.elasticsearch.status === "yellow" && "bg-warning/20 text-warning border-warning/30",
                  data.elasticsearch.status === "red" && "bg-destructive/20 text-destructive border-destructive/30"
                )}>
                  <span className={cn(
                    "mr-1 h-1.5 w-1.5 rounded-full",
                    data.elasticsearch.status === "green" && "bg-success",
                    data.elasticsearch.status === "yellow" && "bg-warning",
                    data.elasticsearch.status === "red" && "bg-destructive"
                  )} />
                  {data.elasticsearch.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Index Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">인덱스 설정</CardTitle>
              <CardDescription>현재 적용된 분석기 및 동의어 설정</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              설정 보기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Analyzer</div>
              <code className="text-sm font-mono text-primary">{data.indexConfig.analyzer}</code>
              <div className="mt-2 flex flex-wrap gap-1">
                {data.indexConfig.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-[10px]">{feature}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground mb-2">Synonyms</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{data.indexConfig.synonymGroups}</span>
                <span className="text-sm text-muted-foreground">groups</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Last updated: {data.indexConfig.lastUpdated}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReindex} disabled={isReindexing}>
              {isReindexing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              전체 재색인
            </Button>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              증분 동기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Index History */}
      {data.history && data.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              색인 히스토리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Docs</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{row.time}</TableCell>
                      <TableCell>
                        <Badge
                          variant={row.type.includes("Full") ? "default" : "secondary"}
                          className={cn(
                            row.type === "Synonym" && "bg-primary/20 text-primary border-primary/30"
                          )}
                        >
                          {row.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.docs ? row.docs.toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{row.duration}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">빠른 링크</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="http://localhost:5601" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Kibana</div>
                  <div className="text-xs text-muted-foreground">ES 시각화 대시보드</div>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="http://localhost:9100" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">ES Head</div>
                  <div className="text-xs text-muted-foreground">클러스터 관리</div>
                </div>
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" asChild>
              <a href="http://localhost:8080/swagger-ui" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">API Docs</div>
                  <div className="text-xs text-muted-foreground">Swagger UI</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
