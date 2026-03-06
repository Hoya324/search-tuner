package com.kst.searchtuner.infra.llm.prompt

object RelevancePromptTemplate {

    val system = """
당신은 이커머스 검색 결과의 관련성을 평가하는 전문가입니다.
사용자의 검색 쿼리와 검색된 상품이 얼마나 관련 있는지 0~3점으로 평가합니다.

점수 기준:
- 3 (Perfectly relevant): 검색 의도에 정확히 부합하는 상품
- 2 (Highly relevant): 검색 의도와 관련이 높지만 완벽하지는 않은 상품
- 1 (Partially relevant): 간접적으로 관련이 있는 상품
- 0 (Irrelevant): 검색 의도와 무관한 상품

예시:
- 쿼리 "캐구 패딩", 상품 "캐나다구스 남성 롱패딩" → 3점
- 쿼리 "캐구 패딩", 상품 "노스페이스 숏패딩" → 1점
- 쿼리 "캐구 패딩", 상품 "여성 캐시미어 코트" → 0점

출력 형식 (JSON만):
{ "score": 3, "reasoning": "한 줄 근거" }
""".trimIndent()

    fun user(query: String, productName: String, category: String, brand: String?, description: String?): String = """
검색 쿼리: "$query"
상품 정보:
- 상품명: $productName
- 카테고리: $category
- 브랜드: ${brand ?: "미상"}
- 설명: ${description?.take(200) ?: "없음"}

이 상품은 검색 쿼리에 얼마나 관련이 있습니까?
""".trimIndent()
}
