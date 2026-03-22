import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/index/status - 인덱스 상태 조회
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/index/status")

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const raw = await response.json()

    // BE: { mysql: { totalProducts, totalShops }, elasticsearch: { connected, documentCount, indexExists },
    //       indexConfig: { indexName, analyzerName }, indexHistory: [{ jobId, type, status }] }
    // FE expects: { mysql: { stores, products }, elasticsearch: { index, alias, docs, size, status },
    //              indexConfig: { analyzer, features, synonymGroups, lastUpdated }, history: [...] }
    const transformed = {
      mysql: {
        stores: raw.mysql?.totalShops ?? 0,
        products: raw.mysql?.totalProducts ?? 0,
      },
      elasticsearch: {
        index: raw.indexConfig?.indexName ?? "products",
        alias: raw.indexConfig?.indexName ?? "products",
        docs: raw.elasticsearch?.documentCount ?? 0,
        size: "-",
        status: raw.elasticsearch?.connected ? "green" : "red",
      },
      indexConfig: {
        analyzer: raw.indexConfig?.analyzerName ?? "설정 없음",
        features: raw.indexConfig?.analyzerName ? ["nori"] : [],
        synonymGroups: 0,
        lastUpdated: raw.indexConfig?.lastUpdated ?? "-",
      },
      history: (raw.indexHistory ?? []).map((h: { jobId: string; type: string; status: string }) => ({
        time: h.jobId,
        type: h.type,
        docs: null,
        duration: h.status,
      })),
    }

    return NextResponse.json(transformed)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch index status" },
      { status: 500 }
    )
  }
}

// POST - 재색인 또는 증분 동기화
// BE endpoints: POST /api/v1/index/full (reindex), POST /api/v1/index/sync (sync)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const endpoint = body.action === "sync" ? "/api/v1/index/sync" : "/api/v1/index/full"

    const response = await fetchFromBackend(endpoint, { method: "POST" })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Index operation failed" },
      { status: 500 }
    )
  }
}
