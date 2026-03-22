import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetchFromBackend("/api/v1/synonyms/suggest-for-product", {
      method: "POST",
      body: JSON.stringify({
        productName: body.productName,
        category: body.category,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get synonym suggestions" },
      { status: 500 }
    )
  }
}
