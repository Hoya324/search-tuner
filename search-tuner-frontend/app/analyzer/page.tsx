import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyzerLab } from "@/components/analyzer/analyzer-lab"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus } from "lucide-react"

export default function AnalyzerPage() {
  return (
    <DashboardLayout
      title="Analyzer Lab"
      description="Nori 분석기 설정 실험 및 토큰화 결과 비교"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            커스텀 설정 추가
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4 mr-1" />
            AI 추천 받기
          </Button>
        </div>
      }
    >
      <AnalyzerLab />
    </DashboardLayout>
  )
}
