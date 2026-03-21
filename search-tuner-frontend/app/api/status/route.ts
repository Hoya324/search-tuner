import { NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/status - 시스템 상태 조회
export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/status")
    
    if (!response.ok) {
      return NextResponse.json(
        { connected: false, error: `Backend returned ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { 
        connected: false, 
        error: error instanceof Error ? error.message : "Failed to connect to backend" 
      },
      { status: 503 }
    )
  }
}
