import { DashboardLayout } from "@/components/dashboard-layout"
import { SearchPlayground } from "@/components/search/search-playground"

export default function SearchPage() {
  return (
    <DashboardLayout
      title="Search Test"
      description="검색어 입력 및 결과 확인, 동의어/분석기 설정 비교"
    >
      <SearchPlayground />
    </DashboardLayout>
  )
}
