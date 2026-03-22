import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/evaluation/metrics")

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()

    const transformed = {
      chartData: (data.chartData ?? []).map((item: any) => ({
        name: item.configLabel ?? item.name ?? "",
        value: item.ndcgAt10 ?? item.value ?? 0,
      })),
      metricsComparison: (data.metricsComparison ?? []).map((item: any) => ({
        metric: item.metricName ?? item.metric ?? "",
        configA: item.valueA ?? item.configA ?? 0,
        configB: item.valueB ?? item.configB ?? 0,
        change: item.delta != null ? item.delta * 100 : (item.change ?? 0),
      })),
      improvedQueries: (data.improvedQueries ?? []).map((item: any) => ({
        query: item.query ?? "",
        change: item.changePct ?? item.change ?? 0,
        scoreA: item.scoreA ?? 0,
        scoreB: item.scoreB ?? 0,
      })),
      degradedQueries: (data.degradedQueries ?? []).map((item: any) => ({
        query: item.query ?? "",
        change: item.changePct ?? item.change ?? 0,
        scoreA: item.scoreA ?? 0,
        scoreB: item.scoreB ?? 0,
        reason: item.reason,
      })),
      pValue: data.pValue ?? undefined,
      llmJudge: data.llmJudge ?? { kappa: 0, agreement: "-", goldenSetAccuracy: 0, goldenSetTotal: 0 },
    }

    return NextResponse.json(transformed)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch evaluation metrics" },
      { status: 500 }
    )
  }
}
