import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// POST /api/v1/synonyms/generate - AI 동의어 생성
// FE sends: { index, field, category, sampleSize }
// BE expects: { name, category, confidenceThreshold, batchSize }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const beRequest = {
      name: `${body.field ?? "product_name"}_${Date.now()}`,
      category: body.category === "all" ? undefined : body.category,
      confidenceThreshold: 0.7,
      batchSize: body.sampleSize ?? 500,
    }

    const response = await fetchFromBackend("/api/v1/synonyms/generate", {
      method: "POST",
      body: JSON.stringify(beRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    // BE returns SynonymSetResponse: { id, name, groups: [{id, terms, type, confidence, reasoning}], ... }
    const data = await response.json()

    // Transform to FE expected shape: { synonyms: SynonymGroup[], synonymSetId }
    const synonyms = (data.groups ?? []).map(
      (group: { id: string; terms: string[]; type: string; confidence: number; reasoning?: string }, idx: number) => ({
        id: data.id * 10000 + idx,
        terms: group.terms,
        type: group.type as "EQUIVALENT" | "EXPLICIT",
        confidence: group.confidence,
        source: "AI Generated" as const,
        category: data.name,
        approved: true,
      })
    )

    return NextResponse.json({ synonyms, synonymSetId: data.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate synonyms" },
      { status: 500 }
    )
  }
}
