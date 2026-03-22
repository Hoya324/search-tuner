import { DashboardLayout } from "@/components/dashboard-layout"
import { CommerceAdmin } from "@/components/admin/commerce-admin"
import { HelpSection } from "@/components/help-section"
import { ScenarioSeeder } from "@/components/admin/scenario-seeder"

const adminFeatures = [
  { title: "가게 목록 & 드릴다운", description: "가게를 클릭하면 해당 가게의 상품 목록으로 바로 이동해 확인합니다." },
  { title: "상품·가게 단건 등록", description: "폼으로 가게/상품을 직접 입력해 즉시 등록합니다." },
  { title: "CSV 대량 임포트", description: "CSV 파일 업로드로 다수의 가게·상품을 한 번에 등록합니다." },
  { title: "동의어 자동 제안", description: "상품 등록 후 해당 상품명과 관련된 동의어를 AI가 자동으로 제안합니다." },
]

const adminHelp = [
  { step: 1, title: "탭 선택", description: "가게 관리 또는 상품 관리 탭을 선택하세요." },
  { step: 2, title: "검색 및 확인", description: "목록에서 가게/상품을 확인하세요." },
  { step: 3, title: "추가", description: "'추가' 버튼으로 단건 등록하거나 CSV 임포트로 대량 등록하세요." },
  { step: 4, title: "CSV 형식", description: "상품: shopId,productName,description,brand,category,price / 가게: name,description,category" },
]

export default function AdminPage() {
  return (
    <DashboardLayout
      title="Admin"
      description="가게 및 상품 관리"
    >
      <div className="space-y-6">
        <HelpSection features={adminFeatures} steps={adminHelp} />
        <ScenarioSeeder />
        <CommerceAdmin />
      </div>
    </DashboardLayout>
  )
}
