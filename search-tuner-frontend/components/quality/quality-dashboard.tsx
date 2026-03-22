"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Play, Info, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface MetricComparison {
  metric: string
  configA: number
  configB: number
  change: number
}

interface QueryResult {
  query: string
  scoreA: number
  scoreB: number
  change: number
  reason?: string
}

interface QualityData {
  chartData: { name: string; value: number }[]
  metricsComparison: MetricComparison[]
  improvedQueries: QueryResult[]
  degradedQueries: QueryResult[]
  pValue: number
  llmJudge: {
    kappa: number
    agreement: string
    goldenSetAccuracy: number
    goldenSetTotal: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function QualityDashboard() {
  const [configA, setConfigA] = useState("baseline")
  const [configB, setConfigB] = useState("v3")
  const [isRunning, setIsRunning] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<QualityData>("/api/evaluation", fetcher)

  const handleRunComparison = async () => {
    setIsRunning(true)
    try {
      const response = await fetch("/api/evaluation/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configA, configB }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const msg = data?.error ?? "비교 실패"
        if (response.status >= 500) {
          toast.error("비교 실행 실패", {
            description: "평가 데이터가 없습니다. 먼저 각 Config로 '평가 실행'을 완료해야 합니다.",
            duration: 8000,
          })
        } else {
          toast.error("비교 실행 실패", { description: msg })
        }
        return
      }

      await mutate()
      toast.success("비교 완료")
    } catch (err) {
      toast.error("비교 실행 오류", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsRunning(false)
    }
  }

  // No data state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">품질 데이터 로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="mt-4 text-sm text-destructive">품질 데이터를 불러오는데 실패했습니다</p>
            <p className="text-xs text-muted-foreground mt-1">백엔드 서버 연결을 확인하세요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Info className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">품질 평가 데이터 없음</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              아래에서 A/B 비교를 실행하여 품질 평가를 시작하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      {data.chartData && data.chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">nDCG@10 추이 (최근 평가)</CardTitle>
            <CardDescription>
              검색 품질 점수 변화 추이
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    domain={[0.5, 0.9]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>nDCG@10:</span>
              {data.chartData.map((point, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{(point.value ?? 0).toFixed(2)}</span>
                  {i < data.chartData.length - 1 && <ArrowRight className="h-3 w-3" />}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* A/B Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">A/B 비교</CardTitle>
          <CardDescription>
            두 설정 간의 검색 품질 비교
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Config A</Label>
              <Select value={configA} onValueChange={setConfigA}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">baseline (동의어 없음)</SelectItem>
                  <SelectItem value="v1">v1 (기본 동의어)</SelectItem>
                  <SelectItem value="v2">v2 (AI 동의어)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Config B</Label>
              <Select value={configB} onValueChange={setConfigB}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="v2">v2 (AI 동의어)</SelectItem>
                  <SelectItem value="v3">v3 (AI 동의어 + mixed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRunComparison} disabled={isRunning}>
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              비교 실행
            </Button>
          </div>

          {data.metricsComparison && data.metricsComparison.length > 0 && (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Config A</TableHead>
                      <TableHead className="text-right">Config B</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.metricsComparison.map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell className="font-medium">{row.metric}</TableCell>
                        <TableCell className="text-right font-mono">{(row.configA ?? 0).toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{(row.configB ?? 0).toFixed(4)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 ${row.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {row.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {row.change >= 0 ? '+' : ''}{(row.change ?? 0).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.pValue !== undefined && (
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-medium">p-value</TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right font-mono">{(data.pValue ?? 0).toFixed(4)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {data.pValue !== undefined && data.pValue < 0.05 && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-success">통계적으로 유의한 차이 (p {"<"} 0.05)</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Query Details */}
      {((data.improvedQueries && data.improvedQueries.length > 0) || (data.degradedQueries && data.degradedQueries.length > 0)) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Improved Queries */}
          {data.improvedQueries && data.improvedQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  개선된 쿼리
                  <Badge variant="secondary" className="ml-auto">
                    {data.improvedQueries.length}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">A</TableHead>
                        <TableHead className="text-right">B</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.improvedQueries.map((row) => (
                        <TableRow key={row.query}>
                          <TableCell className="font-medium text-sm">{row.query}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{(row.scoreA ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{(row.scoreB ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-success text-sm">+{row.change}%</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Degraded Queries */}
          {data.degradedQueries && data.degradedQueries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  악화된 쿼리
                  <Badge variant="destructive" className="ml-auto">
                    {data.degradedQueries.length}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-destructive/30 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-destructive/5">
                        <TableHead>Query</TableHead>
                        <TableHead className="text-right">A</TableHead>
                        <TableHead className="text-right">B</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.degradedQueries.map((row) => (
                        <TableRow key={row.query}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{row.query}</div>
                              {row.reason && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-warning">
                                  <AlertTriangle className="h-3 w-3" />
                                  원인: {row.reason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{(row.scoreA ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{(row.scoreB ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-destructive text-sm">{row.change}%</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="/synonyms">동의어 관리에서 충돌 해결하기</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* LLM Judge Reliability */}
      {data.llmJudge && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LLM Judge 신뢰도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-bold text-primary">κ</span>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(data.llmJudge.kappa ?? 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Cohen&apos;s Kappa</div>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-sm text-muted-foreground">Agreement Level</div>
                <Badge variant="secondary" className="mt-1">{data.llmJudge.agreement}</Badge>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-sm text-muted-foreground">Golden Set 일치율</div>
                <div className="mt-1 text-lg font-bold">{data.llmJudge.goldenSetAccuracy}/{data.llmJudge.goldenSetTotal}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
