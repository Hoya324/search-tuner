import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/synonyms - 동의어 목록 조회
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/synonyms")
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch synonyms" },
      { status: 500 }
    )
  }
}

// POST /api/v1/synonyms - 동의어 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetchFromBackend("/api/v1/synonyms", {
      method: "POST",
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
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

// DELETE /api/v1/synonyms/{id} - 동의어 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    const response = await fetchFromBackend(`/api/v1/synonyms/${id}`, {
      method: "DELETE",
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText },
        { status: response.status }
      )
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
