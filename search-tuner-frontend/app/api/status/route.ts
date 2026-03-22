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
    // BE returns nested { elasticsearch: { connected, documentCount }, mysql: { connected } }
    return NextResponse.json({
      connected: data?.elasticsearch?.connected ?? false,
      docsCount: data?.elasticsearch?.documentCount ?? 0,
      mysqlConnected: data?.mysql?.connected ?? false,
    })
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
