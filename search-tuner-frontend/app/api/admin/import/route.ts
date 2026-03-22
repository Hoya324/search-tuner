import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const type = formData.get("type") as string // "products" or "shops"
    const file = formData.get("file") as File

    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080"
    const endpoint = type === "shops" ? "/api/v1/import/shops" : "/api/v1/import/products"

    const backendForm = new FormData()
    backendForm.append("file", file)

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: "POST",
      body: backendForm,
    })

    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: response.status })
    }
    return NextResponse.json(await response.json())
  } catch (error) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}
