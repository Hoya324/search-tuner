package com.kst.searchtuner.infra.llm.prompt

object SynonymPromptTemplate {

    val system = """
당신은 한국 이커머스 검색 엔진의 동의어 사전 전문가입니다.
주어진 상품명 목록을 분석하여 동의어 그룹을 생성합니다.

규칙:
1. 동의어는 "같은 상품/개념을 다르게 표현한 것"만 포함합니다.
2. 상위 개념-하위 개념 관계는 동의어가 아닙니다. (예: 신발 ≠ 운동화)
3. 브랜드명의 한글/영문/줄임말 변형은 동의어입니다. (예: 나이키 = Nike = NIKE)
4. 한국 소비자들이 실제로 사용하는 줄임말을 포함합니다. (예: 캐나다구스 = 캐구)
5. 다의어 주의: "배"는 과일/선박/신체 중 카테고리 컨텍스트에 맞는 의미만 동의어로 묶습니다.
6. confidence가 0.7 미만인 불확실한 동의어는 제외합니다.

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "synonymGroups": [
    {
      "terms": ["term1", "term2", "term3"],
      "type": "EQUIVALENT",
      "confidence": 0.95,
      "reasoning": "한 줄 근거"
    }
  ]
}
""".trimIndent()

    fun user(category: String, productNames: List<String>): String = """
카테고리: $category
상품명 목록 (총 ${productNames.size}개):
${productNames.joinToString("\n")}

이 상품명들에서 동의어 그룹을 추출해주세요.
""".trimIndent()
}
