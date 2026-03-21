import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// POST /api/v1/evaluation/ab-test - A/B 테스트 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetchFromBackend("/api/v1/evaluation/ab-test", {
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
      { error: error instanceof Error ? error.message : "A/B test failed" },
      { status: 500 }
    )
  }
}
