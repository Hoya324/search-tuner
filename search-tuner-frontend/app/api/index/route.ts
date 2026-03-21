import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/index/status - 인덱스 상태 조회
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/index/status")
    
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
      { error: error instanceof Error ? error.message : "Failed to fetch index status" },
      { status: 500 }
    )
  }
}

// POST /api/v1/index/reindex - 재색인 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetchFromBackend("/api/v1/index/reindex", {
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
      { error: error instanceof Error ? error.message : "Reindex failed" },
      { status: 500 }
    )
  }
}
