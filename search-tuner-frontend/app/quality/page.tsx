import { DashboardLayout } from "@/components/dashboard-layout"
import { QualityDashboard } from "@/components/quality/quality-dashboard"
import { Button } from "@/components/ui/button"
import { Play, FileText, Download } from "lucide-react"
import { HelpSection } from "@/components/help-section"

const qualityFeatures = [
  { title: "IR 지표 (nDCG, P@5, MRR)", description: "검색 품질을 수치로 측정한 nDCG@10·Precision@5·MRR 지표를 확인합니다." },
  { title: "Config A vs B 지표 변화", description: "두 설정 간 각 지표의 개선/하락 비율(%)을 표로 비교합니다." },
  { title: "개선·하락 쿼리 목록", description: "설정 변경 후 순위가 오른 쿼리와 떨어진 쿼리를 각각 확인합니다." },
  { title: "LLM Judge 일치율", description: "AI 판정과 골든셋 기준 정답의 일치 정확도(Cohen's κ)를 확인합니다." },
]

const qualityHelp = [
  { step: 1, title: "사전 조건: 데이터 & 색인", description: "Admin에서 상품을 등록하고, Data 페이지에서 전체 재색인을 먼저 완료하세요." },
  { step: 2, title: "사전 조건: 동의어 적용", description: "Synonym 페이지에서 AI 동의어를 생성하고 Elasticsearch에 적용하세요." },
  { step: 3, title: "Config A/B 선택 후 비교 실행", description: "'baseline'(동의어 없음) vs 'v3'(동의어 적용) 처럼 두 설정을 선택하고 '비교 실행'을 클릭하세요." },
  { step: 4, title: "지표 분석", description: "nDCG@10, Precision@5, MRR 지표 변화와 개선/하락 쿼리 목록을 확인하세요." },
]

export default function QualityPage() {
  return (
    <DashboardLayout
      title="Quality Dashboard"
      description="검색 품질 측정 및 설정 변경 전후 비교"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            쿼리 세트 관리
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            리포트 내보내기
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-1" />
            평가 실행
          </Button>
        </div>
      }
    >
      <HelpSection features={qualityFeatures} steps={qualityHelp} />
      <QualityDashboard />
    </DashboardLayout>
  )
}
