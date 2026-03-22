import { DashboardLayout } from "@/components/dashboard-layout"
import { SynonymManager } from "@/components/synonyms/synonym-manager"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download } from "lucide-react"
import { HelpSection } from "@/components/help-section"

const synonymsFeatures = [
  { title: "현재 적용된 동의어 목록", description: "Elasticsearch에 실제 적용된 동의어 그룹 전체를 확인합니다." },
  { title: "AI 생성 동의어 후보", description: "LLM이 상품 데이터를 분석해 제안한 동의어와 신뢰도 점수를 확인합니다." },
  { title: "특정 상품명 기반 생성", description: "원하는 상품명을 직접 입력해 타겟 동의어를 생성할 수 있습니다." },
  { title: "적용 전 파일 미리보기", description: "synonyms.txt에 실제 쓰여질 내용을 적용 전에 미리 확인합니다." },
]

const synonymsHelp = [
  { step: 1, title: "현재 동의어 확인", description: "목록에서 현재 등록된 동의어 그룹을 확인하세요." },
  { step: 2, title: "AI 생성", description: "'AI 생성' 버튼으로 도메인 기반 동의어를 자동 생성하세요." },
  { step: 3, title: "검토 및 선택", description: "생성된 동의어를 검토하고 적용할 항목을 선택하세요." },
  { step: 4, title: "적용 전략 선택", description: "동의어 파일 업데이트 또는 즉시 재색인을 선택하여 적용하세요." },
]

export default function SynonymsPage() {
  return (
    <DashboardLayout
      title="Synonym Manager"
      description="AI 동의어 생성부터 리뷰, 편집, 적용까지 전체 워크플로우 관리"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            파일 업로드
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            사전 다운로드
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            AI 동의어 생성
          </Button>
        </div>
      }
    >
      <HelpSection features={synonymsFeatures} steps={synonymsHelp} />
      <SynonymManager />
    </DashboardLayout>
  )
}
