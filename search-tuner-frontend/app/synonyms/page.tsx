import { DashboardLayout } from "@/components/dashboard-layout"
import { SynonymManager } from "@/components/synonyms/synonym-manager"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download } from "lucide-react"

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
      <SynonymManager />
    </DashboardLayout>
  )
}
