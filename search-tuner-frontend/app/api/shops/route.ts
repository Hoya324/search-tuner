import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") ?? "0"
    const size = searchParams.get("size") ?? "20"
    const response = await fetchFromBackend(`/api/v1/shops?page=${page}&size=${size}`)
    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await fetchFromBackend("/api/v1/shops", {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 })
  }
}
