import { NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

export async function GET() {
  try {
    const response = await fetchFromBackend("/api/v1/products")
    if (!response.ok) return NextResponse.json({ categories: [], brands: [] })

    const products: { category: string; brand?: string }[] = await response.json()

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort()
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort()

    return NextResponse.json({ categories, brands })
  } catch {
    return NextResponse.json({ categories: [], brands: [] })
  }
}
