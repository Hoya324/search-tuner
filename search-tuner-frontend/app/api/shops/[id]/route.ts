import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await fetchFromBackend(`/api/v1/shops/${params.id}`, { method: "DELETE" })
    if (!response.ok) {
      return NextResponse.json({ error: await response.text() }, { status: response.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 })
  }
}
