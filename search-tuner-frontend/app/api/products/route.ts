import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/products - 상품 목록 조회 (페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "20"
    
    const response = await fetchFromBackend(`/api/v1/products?page=${page}&size=${size}`)
    
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
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    )
  }
}
