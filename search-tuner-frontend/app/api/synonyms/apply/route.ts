import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// POST /api/v1/synonyms/{id}/apply - 동의어 적용 (RELOAD or BLUE_GREEN)
// FE sends: { synonymSetId, strategy }
// BE: POST /api/v1/synonyms/{id}/apply with { strategy, indexName }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { synonymSetId, strategy } = body

    if (!synonymSetId) {
      return NextResponse.json({ error: "synonymSetId is required" }, { status: 400 })
    }

    const response = await fetchFromBackend(`/api/v1/synonyms/${synonymSetId}/apply`, {
      method: "POST",
      body: JSON.stringify({
        strategy: strategy || "RELOAD",
        indexName: "products",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply synonyms" },
      { status: 500 }
    )
  }
}
