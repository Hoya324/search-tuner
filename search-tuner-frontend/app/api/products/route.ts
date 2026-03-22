import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// GET /api/v1/products - 상품 목록 조회 (페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "0"
    const size = searchParams.get("size") || "20"
    const shopId = searchParams.get("shopId")

    const url = shopId
      ? `/api/v1/products?shopId=${shopId}`
      : `/api/v1/products?page=${page}&size=${size}`
    const response = await fetchFromBackend(url)
    
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetchFromBackend("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    )
  }
}
