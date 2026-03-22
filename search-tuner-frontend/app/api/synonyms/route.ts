import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

type BeGroup = { id: string; terms: string[]; type: string; confidence: number; reasoning?: string }
type BeSet = { id: number; name: string; status: string; updatedAt: string; groups: BeGroup[] }

// GET /api/v1/synonyms
// BE returns List<SynonymSetResponse>, FE expects { synonyms: SynonymGroup[], lastUpdated }
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/synonyms")

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const sets: BeSet[] = await response.json()

    // Flatten groups. Synthetic numeric ID = setId * 10000 + groupIndex (reversible for delete)
    const synonyms = sets.flatMap((set) =>
      set.groups.map((group, idx) => ({
        id: set.id * 10000 + idx,
        terms: group.terms,
        type: group.type as "EQUIVALENT" | "EXPLICIT",
        confidence: group.confidence,
        source: "AI Generated" as const,
        category: set.name,
        approved: set.status === "APPROVED",
      }))
    )

    const lastUpdated =
      sets.length > 0
        ? [...sets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].updatedAt
        : null

    return NextResponse.json({ synonyms, lastUpdated })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch synonyms" },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/synonyms/{setId}
// FE passes synthetic id (setId * 10000 + groupIndex); extract real setId
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const syntheticId = parseInt(searchParams.get("id") || "0")
    const setId = Math.floor(syntheticId / 10000)

    const response = await fetchFromBackend(`/api/v1/synonyms/${setId}`, { method: "DELETE" })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete synonym" },
      { status: 500 }
    )
  }
}
