import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyzerLab } from "@/components/analyzer/analyzer-lab"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus } from "lucide-react"
import { HelpSection } from "@/components/help-section"

const analyzerFeatures = [
  { title: "분석기별 토큰화 결과 비교", description: "동일 텍스트를 korean_search, standard 등 여러 분석기로 나눈 토큰을 나란히 비교합니다." },
  { title: "품사 필터링 효과 확인", description: "조사·어미 등 불필요한 품사가 제거된 후 토큰이 어떻게 달라지는지 확인합니다." },
  { title: "AI 분석기 추천", description: "입력 텍스트 도메인에 맞는 최적 분석기 설정을 AI가 추천하고 이유를 설명합니다." },
  { title: "분해 모드(Decompound) 비교", description: "복합어 분해 방식(none / discard / mixed)에 따른 토큰 차이를 확인합니다." },
]

const analyzerHelp = [
  { step: 1, title: "텍스트 입력", description: "분석할 텍스트를 입력창에 입력하세요." },
  { step: 2, title: "분석 실행", description: "'분석' 버튼을 클릭하여 토큰화를 실행하세요." },
  { step: 3, title: "토큰화 비교", description: "여러 분석기의 토큰화 결과를 비교하세요." },
  { step: 4, title: "AI 추천 적용", description: "AI가 추천하는 최적 분석기 설정을 확인하세요." },
]

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
      <HelpSection features={analyzerFeatures} steps={analyzerHelp} />
      <AnalyzerLab />
    </DashboardLayout>
  )
}
