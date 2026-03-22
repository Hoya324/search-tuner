import { DashboardLayout } from "@/components/dashboard-layout"
import { DataManager } from "@/components/data/data-manager"
import { Button } from "@/components/ui/button"
import { RefreshCw, Upload } from "lucide-react"
import { HelpSection } from "@/components/help-section"

const dataFeatures = [
  { title: "MySQL 데이터 현황", description: "현재 DB에 등록된 가게 수·상품 수를 한눈에 확인합니다." },
  { title: "Elasticsearch 인덱스 상태", description: "ES 연결 여부, 색인된 문서 수, 현재 적용된 분석기 이름을 확인합니다." },
  { title: "색인 작업 이력", description: "전체 재색인·증분 동기화 작업의 실행 기록과 상태를 확인합니다." },
]

const dataHelp = [
  { step: 1, title: "데이터 요약 확인", description: "가게/상품 수와 Elasticsearch 색인 상태를 확인하세요." },
  { step: 2, title: "재색인 또는 동기화", description: "'전체 재색인' 또는 '증분 동기화'로 ES 색인을 최신 상태로 유지하세요." },
]

export default function DataPage() {
  return (
    <DashboardLayout
      title="Data Manager"
      description="가게/상품 데이터 관리 및 ES 색인 상태 관리"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            CSV Import
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            전체 재색인
          </Button>
        </div>
      }
    >
      <HelpSection features={dataFeatures} steps={dataHelp} />
      <DataManager />
    </DashboardLayout>
  )
}
