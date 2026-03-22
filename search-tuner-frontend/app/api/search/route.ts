import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// POST /api/v1/products/search
// FE sends: { query, config, explain }
// BE expects: { query, from, size, indexName, explain, highlight }
// BE returns: { hits: [{ productId, productName, brand, category, score, highlights }], total, took }
// FE expects: { results: [{ id, title, store, price, category, score, matchInfo, explain }], tokens, totalHits, took }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const beRequest = {
      query: body.query,
      from: body.from ?? 0,
      size: body.size ?? 10,
      indexName: "products",
      explain: body.explain ?? false,
      highlight: true,
    }

    const response = await fetchFromBackend("/api/v1/products/search", {
      method: "POST",
      body: JSON.stringify(beRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()

    // Transform BE response to FE expected shape
    const results = (data.hits ?? []).map((hit: {
      productId: number
      productName: string
      brand?: string
      category: string
      score: number
      price?: number
      highlights: Record<string, string[]>
    }) => ({
      id: hit.productId,
      title: hit.productName,
      store: hit.brand ?? "-",
      price: hit.price ?? 0,
      category: hit.category,
      score: hit.score,
      matchInfo: Object.entries(hit.highlights ?? {})
        .flatMap(([, vals]) => vals)
        .join(", ") || hit.productName,
    }))

    return NextResponse.json({
      results,
      tokens: [],
      totalHits: data.total ?? 0,
      took: data.took ?? 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    )
  }
}
