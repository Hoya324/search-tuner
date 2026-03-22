import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// PATCH /api/synonyms/groups/{id}/terms
// id here is the synonymSetId; groupId is passed in the request body
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params
    // id is the synonymSetId, addTerms in body
    const response = await fetchFromBackend(`/api/v1/synonyms/${id}/groups/${body.groupId}/terms`, {
      method: "PATCH",
      body: JSON.stringify({ addTerms: body.addTerms }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add terms" },
      { status: 500 }
    )
  }
}
