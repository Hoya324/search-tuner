import { NextRequest, NextResponse } from "next/server"
import { fetchFromBackend } from "@/lib/api"

// POST /api/v1/synonyms/{id}/apply - 동의어 적용 (RELOAD or BLUE_GREEN)
// 프론트엔드에서 여러 동의어를 한번에 보내므로, 먼저 동의어를 저장한 후 apply 호출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { synonyms, strategy } = body
    
    // 1. 먼저 동의어들을 저장 (POST /api/v1/synonyms)
    const saveResponse = await fetchFromBackend("/api/v1/synonyms", {
      method: "POST",
      body: JSON.stringify({ synonyms }),
    })

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text()
      return NextResponse.json(
        { error: errorText },
        { status: saveResponse.status }
      )
    }

    const saveData = await saveResponse.json()
    const synonymSetId = saveData.id // 저장된 동의어 셋 ID

    // 2. 저장된 동의어 셋을 적용 (POST /api/v1/synonyms/{id}/apply)
    const applyResponse = await fetchFromBackend(`/api/v1/synonyms/${synonymSetId}/apply`, {
      method: "POST",
      body: JSON.stringify({ strategy }),
    })

    if (!applyResponse.ok) {
      const errorText = await applyResponse.text()
      return NextResponse.json(
        { error: errorText },
        { status: applyResponse.status }
      )
    }

    const applyData = await applyResponse.json()
    return NextResponse.json(applyData)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply synonyms" },
      { status: 500 }
    )
  }
}
