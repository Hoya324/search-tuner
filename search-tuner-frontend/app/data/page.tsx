import { DashboardLayout } from "@/components/dashboard-layout"
import { DataManager } from "@/components/data/data-manager"
import { Button } from "@/components/ui/button"
import { RefreshCw, Upload } from "lucide-react"

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
      <DataManager />
    </DashboardLayout>
  )
}
