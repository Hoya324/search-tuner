import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080"

async function createShop(shop: { name: string; description: string; category: string }) {
  const res = await fetch(`${BACKEND_URL}/api/v1/shops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(shop),
  })
  if (!res.ok) throw new Error(`Failed to create shop: ${shop.name}`)
  return res.json() // returns { id, name, ... }
}

async function createProduct(product: {
  shopId: number
  productName: string
  description?: string
  brand?: string
  category: string
  price: number
}) {
  const res = await fetch(`${BACKEND_URL}/api/v1/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  })
  if (!res.ok) throw new Error(`Failed to create product: ${product.productName}`)
  return res.json()
}

// ── Scenario Data ─────────────────────────────────────────────────────────────

const GOLF_SHOPS = [
  { name: "골프존마켓", description: "국내 최대 골프 전문 쇼핑몰", category: "스포츠/골프" },
  { name: "파크골프클럽", description: "파크골프 및 골프 용품 전문", category: "스포츠/골프" },
  { name: "프로골프샵", description: "프로 골퍼를 위한 프리미엄 용품", category: "스포츠/골프" },
]

const FASHION_SHOPS = [
  { name: "트렌드위크", description: "최신 트렌드 여성의류 전문", category: "패션/여성의류" },
  { name: "썸머스타일", description: "여름 시즌 전문 의류 브랜드", category: "패션/여성의류" },
  { name: "미니멀룩", description: "심플하고 세련된 기본 의류", category: "패션/여성의류" },
]

const ELECTRONICS_SHOPS = [
  { name: "디지털팩토리", description: "최신 전자기기 전문 쇼핑몰", category: "전자기기" },
  { name: "테크마켓", description: "스마트 기기 및 액세서리", category: "전자기기" },
  { name: "사운드월드", description: "오디오 및 음향기기 전문", category: "전자기기" },
]

// Products are functions that take shopIds array and return product objects
function golfProducts(shopIds: number[]) {
  return [
    { shopId: shopIds[0], productName: "드라이버 클럽 460cc", description: "티샷용 드라이버 클럽 남성용", brand: "캘러웨이", category: "스포츠/골프", price: 320000 },
    { shopId: shopIds[0], productName: "드라이버 클럽 여성용", description: "여성용 경량 드라이버 클럽", brand: "테일러메이드", category: "스포츠/골프", price: 280000 },
    { shopId: shopIds[0], productName: "아이언 세트 7개", description: "7개 아이언 풀세트", brand: "핑", category: "스포츠/골프", price: 580000 },
    { shopId: shopIds[0], productName: "골프공 12구", description: "프리미엄 3피스 골프공", brand: "타이틀리스트", category: "스포츠/골프", price: 45000 },
    { shopId: shopIds[0], productName: "골프 캐디백", description: "4륜 바퀴 캐디백 방수", brand: "코브라", category: "스포츠/골프", price: 180000 },
    { shopId: shopIds[1], productName: "퍼터 말렛형", description: "넓은 스위트스팟 말렛 퍼터", brand: "오디세이", category: "스포츠/골프", price: 220000 },
    { shopId: shopIds[1], productName: "골프화 남성", description: "스파이크리스 골프화 방수", brand: "풋조이", category: "스포츠/골프", price: 160000 },
    { shopId: shopIds[1], productName: "골프장갑 남성", description: "천연가죽 골프장갑", brand: "타이틀리스트", category: "스포츠/골프", price: 35000 },
    { shopId: shopIds[1], productName: "페어웨이 우드 3번", description: "페어웨이 우드 3번", brand: "테일러메이드", category: "스포츠/골프", price: 250000 },
    { shopId: shopIds[2], productName: "골프 스윙 연습기", description: "실내 스윙 훈련 도구", brand: "미즈노", category: "스포츠/골프", price: 75000 },
    { shopId: shopIds[2], productName: "골프 거리측정기", description: "레이저 거리측정기 600m", brand: "부시넬", category: "스포츠/골프", price: 320000 },
    { shopId: shopIds[2], productName: "골프 티 50개입", description: "나무 골프 티 혼합 높이", brand: "", category: "스포츠/골프", price: 8000 },
  ]
}

function fashionProducts(shopIds: number[]) {
  return [
    { shopId: shopIds[0], productName: "민소매 원피스 화이트", description: "시원한 여름 민소매 미디 원피스", brand: "트렌드위크", category: "패션/여성의류", price: 45000 },
    { shopId: shopIds[0], productName: "나시 원피스 블랙", description: "날씬해 보이는 나시 원피스", brand: "트렌드위크", category: "패션/여성의류", price: 42000 },
    { shopId: shopIds[0], productName: "슬리브리스 원피스 플로럴", description: "꽃무늬 슬리브리스 미디 원피스", brand: "트렌드위크", category: "패션/여성의류", price: 52000 },
    { shopId: shopIds[0], productName: "노슬리브 블라우스", description: "우아한 노슬리브 쉬폰 블라우스", brand: "트렌드위크", category: "패션/여성의류", price: 38000 },
    { shopId: shopIds[1], productName: "민소매 티셔츠 5색", description: "기본 민소매 티셔츠 세트", brand: "썸머스타일", category: "패션/여성의류", price: 25000 },
    { shopId: shopIds[1], productName: "나시 크롭탑", description: "배꼽 위 크롭 나시탑", brand: "썸머스타일", category: "패션/여성의류", price: 28000 },
    { shopId: shopIds[1], productName: "린넨 와이드팬츠", description: "시원한 린넨 소재 와이드팬츠", brand: "썸머스타일", category: "패션/여성의류", price: 55000 },
    { shopId: shopIds[1], productName: "썸머 쉬폰 블라우스", description: "반투명 쉬폰 여름 블라우스", brand: "썸머스타일", category: "패션/여성의류", price: 35000 },
    { shopId: shopIds[2], productName: "기본 민소매 흰색", description: "100% 면 기본 민소매", brand: "미니멀룩", category: "패션/여성의류", price: 18000 },
    { shopId: shopIds[2], productName: "슬리브리스 니트", description: "여름용 슬리브리스 니트탑", brand: "미니멀룩", category: "패션/여성의류", price: 48000 },
    { shopId: shopIds[2], productName: "나시 롱원피스", description: "발목 길이 나시 롱원피스", brand: "미니멀룩", category: "패션/여성의류", price: 65000 },
  ]
}

function electronicsProducts(shopIds: number[]) {
  return [
    { shopId: shopIds[0], productName: "블루투스 이어폰 노이즈캔슬링", description: "액티브 노이즈캔슬링 무선 이어폰", brand: "소니", category: "전자기기", price: 159000 },
    { shopId: shopIds[0], productName: "블루투스 헤드폰 오버이어", description: "프리미엄 무선 헤드폰", brand: "보스", category: "전자기기", price: 380000 },
    { shopId: shopIds[0], productName: "삼성 갤럭시탭 S9", description: "11인치 AMOLED 태블릿 256GB", brand: "삼성", category: "전자기기", price: 890000 },
    { shopId: shopIds[0], productName: "삼성 갤럭시탭 A9", description: "10.5인치 기본형 태블릿", brand: "삼성", category: "전자기기", price: 370000 },
    { shopId: shopIds[1], productName: "에어팟 호환 무선이어폰", description: "아이폰 호환 무선 블루투스 이어폰", brand: "앤커", category: "전자기기", price: 45000 },
    { shopId: shopIds[1], productName: "갤럭시 버즈2 프로", description: "삼성 무선 이어버즈", brand: "삼성", category: "전자기기", price: 179000 },
    { shopId: shopIds[1], productName: "무선 이어폰 방수 스포츠", description: "IPX5 방수 스포츠 무선이어폰", brand: "QCY", category: "전자기기", price: 35000 },
    { shopId: shopIds[1], productName: "블루투스 스피커 방수", description: "야외용 방수 블루투스 스피커", brand: "JBL", category: "전자기기", price: 89000 },
    { shopId: shopIds[2], productName: "무선 키보드 블루투스", description: "멀티페어링 블루투스 키보드", brand: "로지텍", category: "전자기기", price: 89000 },
    { shopId: shopIds[2], productName: "블루투스 마우스 무소음", description: "무소음 블루투스 마우스", brand: "로지텍", category: "전자기기", price: 65000 },
    { shopId: shopIds[2], productName: "태블릿 거치대", description: "갤럭시탭 아이패드 호환 거치대", brand: "", category: "전자기기", price: 25000 },
  ]
}

export async function POST(request: NextRequest) {
  try {
    const { scenario } = await request.json()

    let shopDefs: { name: string; description: string; category: string }[] = []
    let productFn: (ids: number[]) => object[] = () => []

    if (scenario === "golf") {
      shopDefs = GOLF_SHOPS
      productFn = golfProducts
    } else if (scenario === "fashion") {
      shopDefs = FASHION_SHOPS
      productFn = fashionProducts
    } else if (scenario === "electronics") {
      shopDefs = ELECTRONICS_SHOPS
      productFn = electronicsProducts
    } else if (scenario === "all") {
      // Run all three sequentially
      const results = []
      for (const [shops, fn] of [
        [GOLF_SHOPS, golfProducts],
        [FASHION_SHOPS, fashionProducts],
        [ELECTRONICS_SHOPS, electronicsProducts],
      ] as const) {
        const ids: number[] = []
        for (const s of shops) {
          const created = await createShop(s)
          ids.push(created.id)
        }
        const products = fn(ids)
        let productCount = 0
        for (const p of products) {
          await createProduct(p as Parameters<typeof createProduct>[0])
          productCount++
        }
        results.push({ shops: ids.length, products: productCount })
      }
      const total = results.reduce(
        (acc, r) => ({ shops: acc.shops + r.shops, products: acc.products + r.products }),
        { shops: 0, products: 0 }
      )
      return NextResponse.json({ success: true, scenario: "all", ...total })
    } else {
      return NextResponse.json({ error: "Unknown scenario" }, { status: 400 })
    }

    // Create shops
    const shopIds: number[] = []
    for (const s of shopDefs) {
      const created = await createShop(s)
      shopIds.push(created.id)
    }

    // Create products
    const products = productFn(shopIds)
    let productCount = 0
    for (const p of products) {
      await createProduct(p as Parameters<typeof createProduct>[0])
      productCount++
    }

    return NextResponse.json({
      success: true,
      scenario,
      shops: shopIds.length,
      products: productCount,
      message: `${shopIds.length}개 가게, ${productCount}개 상품이 등록되었습니다.`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 500 }
    )
  }
}
