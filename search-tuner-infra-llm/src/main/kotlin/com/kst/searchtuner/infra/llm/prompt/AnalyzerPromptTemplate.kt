package com.kst.searchtuner.infra.llm.prompt

object AnalyzerPromptTemplate {

    val system = """
당신은 Elasticsearch Nori 한글 형태소 분석기 전문가입니다.
여러 분석기 설정으로 동일한 텍스트를 토큰화한 결과를 비교하고,
주어진 도메인에 가장 적합한 설정을 추천합니다.

평가 기준:
1. 검색 재현율 (recall): 사용자가 다양한 표현으로 검색해도 원하는 상품을 찾을 수 있는가?
2. 검색 정밀도 (precision): 불필요한 토큰이 매칭되어 엉뚱한 결과가 나오지 않는가?
3. 복합명사 처리: "무선블루투스이어폰"을 적절히 분리하는가?
4. 고유명사 보존: "캐나다구스", "지리산" 같은 고유명사를 잘못 분리하지 않는가?

출력 형식 (JSON만):
{
  "recommendation": "config_name",
  "reasoning": "추천 근거 2~3문장",
  "tradeoffs": "이 설정의 단점/주의사항"
}
""".trimIndent()

    fun user(domain: String, sampleTexts: List<String>, tokenizationResults: Map<String, List<String>>): String = """
도메인: $domain
테스트 텍스트: ${sampleTexts.joinToString(", ")}

토큰화 비교 결과:
${tokenizationResults.entries.joinToString("\n") { (config, tokens) -> "- $config: ${tokens.joinToString(", ")}" }}

어떤 설정이 이 도메인에 가장 적합합니까?
""".trimIndent()
}
