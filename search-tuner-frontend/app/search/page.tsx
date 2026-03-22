import { DashboardLayout } from "@/components/dashboard-layout"
import { SearchPlayground } from "@/components/search/search-playground"
import { HelpSection } from "@/components/help-section"

const searchFeatures = [
  { title: "검색 결과 순위 & 점수", description: "각 상품의 BM25 관련성 점수와 순위를 실시간으로 확인합니다." },
  { title: "하이라이트 매칭 구간", description: "검색어가 상품명 어느 부분에 매칭됐는지 강조 표시로 확인합니다." },
  { title: "Config A/B 나란히 비교", description: "동의어 없음(A) vs AI 동의어 적용(B) 결과를 동시에 비교합니다." },
  { title: "토큰 분석 결과", description: "입력 검색어가 한국어 분석기에 의해 어떤 토큰으로 나뉘는지 확인합니다." },
]

const searchHelp = [
  { step: 1, title: "검색어 입력", description: "상단 검색창에 테스트할 검색어를 입력하세요." },
  { step: 2, title: "Config 선택", description: "Config A(동의어 없음) / Config B(AI 동의어 적용) / 나란히 비교 중 선택하세요." },
  { step: 3, title: "결과 확인", description: "검색 결과 순위, 점수, 매칭 구간, 토큰 분석 결과를 확인하세요." },
]

export default function SearchPage() {
  return (
    <DashboardLayout
      title="Search Test"
      description="검색어 입력 및 결과 확인, 동의어/분석기 설정 비교"
    >
      <HelpSection features={searchFeatures} steps={searchHelp} />
      <SearchPlayground />
    </DashboardLayout>
  )
}
