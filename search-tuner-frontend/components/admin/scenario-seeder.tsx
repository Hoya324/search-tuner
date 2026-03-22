"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, ShoppingBag, Shirt, Cpu } from "lucide-react"
import { toast } from "sonner"
import { mutate } from "swr"

const SCENARIOS = [
  {
    id: "golf",
    label: "골프 용품",
    description: '시나리오 1: "드라이버" 검색 품질 이슈 재현용',
    icon: ShoppingBag,
    shops: 3,
    products: 12,
    color: "text-green-600",
  },
  {
    id: "fashion",
    label: "여름 패션",
    description: '시나리오 2: "나시/민소매/슬리브리스" 동의어 테스트용',
    icon: Shirt,
    shops: 3,
    products: 11,
    color: "text-pink-600",
  },
  {
    id: "electronics",
    label: "전자기기",
    description: '시나리오 3: "블투/갤탭" 오타·약칭 처리 테스트용',
    icon: Cpu,
    shops: 3,
    products: 11,
    color: "text-blue-600",
  },
  {
    id: "all",
    label: "전체 시나리오",
    description: "3개 시나리오 전체 데이터 한 번에 등록",
    icon: Database,
    shops: 9,
    products: 34,
    color: "text-purple-600",
  },
]

export function ScenarioSeeder() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSeed = async (scenario: string) => {
    setLoading(scenario)
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "등록 실패")
      toast.success(`${data.shops}개 가게, ${data.products}개 상품 등록 완료`, {
        description: "Data 페이지에서 재색인을 실행하세요.",
        duration: 6000,
      })
      mutate("/api/shops")
      mutate("/api/products")
    } catch (err) {
      toast.error("데이터 초기화 실패", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">시나리오 샘플 데이터 로드</CardTitle>
        <CardDescription>
          테스트 시나리오별 가게·상품 데이터를 자동으로 등록합니다. 등록 후 Data 페이지에서 재색인이 필요합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((s) => {
            const Icon = s.icon
            const isLoading = loading === s.id
            return (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${s.color}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{s.label}</span>
                      <Badge variant="outline" className="text-[10px] h-4">가게 {s.shops}</Badge>
                      <Badge variant="outline" className="text-[10px] h-4">상품 {s.products}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => handleSeed(s.id)}
                  disabled={loading !== null}
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "등록"}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
