import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetchFromBackend(`/api/v1/synonyms/${id}/preview`)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const text = await response.text()
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get synonym preview" },
      { status: 500 }
    )
  }
}
