import { DashboardLayout } from "@/components/dashboard-layout"
import { QualityDashboard } from "@/components/quality/quality-dashboard"
import { Button } from "@/components/ui/button"
import { Play, FileText, Download } from "lucide-react"

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
      <QualityDashboard />
    </DashboardLayout>
  )
}
