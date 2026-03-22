import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetchFromBackend("/api/v1/synonyms/generate/from-product", {
      method: "POST",
      body: JSON.stringify({
        productName: body.productName,
        excludeExisting: body.excludeExisting ?? true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    // Transform same shape as /api/synonyms/generate
    const synonyms = (data.groups ?? []).map((group: { id: string; terms: string[]; type: string; confidence: number; reasoning?: string }, idx: number) => ({
      id: data.id * 10000 + idx,
      terms: group.terms,
      type: group.type as "EQUIVALENT" | "EXPLICIT",
      confidence: group.confidence,
      source: "AI Generated" as const,
      category: data.name,
      approved: true,
    }))

    return NextResponse.json({
      synonymSetId: data.id,
      synonyms,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate synonyms from product" },
      { status: 500 }
    )
  }
}
