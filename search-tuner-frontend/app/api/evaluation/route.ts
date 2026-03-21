import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/evaluation/metrics - 품질 메트릭 조회
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/evaluation/metrics")
    
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
      { error: error instanceof Error ? error.message : "Failed to fetch evaluation metrics" },
      { status: 500 }
    )
  }
}
