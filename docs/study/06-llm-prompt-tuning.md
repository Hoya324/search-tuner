# 06. LLM 프롬프트 튜닝 — 동의어 품질 개선

## 배경

LLM이 생성하는 동의어 품질은 프롬프트에 크게 좌우됨.
같은 모델도 프롬프트에 따라 결과가 크게 달라짐.

현재 프롬프트: `search-tuner-infra-llm/src/main/kotlin/.../prompt/SynonymPromptTemplate.kt`

---

## 실험 6-1. 현재 프롬프트 결과 분석

```bash
# 실제 생성된 동의어 결과 확인
curl "http://localhost:8080/api/v1/synonyms/{id}"
```

### 평가 기준

| 항목 | 확인 내용 |
|------|----------|
| 정밀도 | 틀린 동의어가 얼마나 있는가? |
| 재현율 | 놓친 명백한 동의어가 있는가? |
| confidence 보정 | confidence 0.9 이상인데 실제로 틀린 경우? |
| 타입 분류 | EQUIVALENT/ONEWAY 분류가 맞는가? |

---

## 실험 6-2. Few-shot 예시 추가

**현재 (zero-shot or minimal)**:
```
다음 상품명 목록에서 동의어를 추출하세요.
```

**개선 (few-shot)**:
```
한국 커머스 검색을 위한 동의어를 추출합니다.

예시:
입력: ["나이키", "Nike", "NIKE", "나이키코리아"]
출력: {"terms": ["나이키", "Nike", "NIKE"], "type": "EQUIVALENT", "confidence": 0.97, "reasoning": "동일 브랜드의 한글/영문/대문자 표기 변형"}

입력: ["나이끼", "나이키"]
출력: {"terms": ["나이끼", "나이키"], "type": "ONEWAY", "confidence": 0.99, "reasoning": "오타 → 정확한 표기 단방향 매핑"}

이제 다음 목록에서 동의어를 추출하세요:
{terms}
```

### 실험 방법
1. `SynonymPromptTemplate.kt` 수정
2. 동일한 샘플 데이터로 동의어 재생성
3. 결과 품질 비교 (정밀도, 재현율)

---

## 실험 6-3. 도메인 컨텍스트 주입

```kotlin
// 현재
val prompt = "다음 상품명 목록에서 동의어를 추출하세요."

// 개선: 카테고리 컨텍스트 추가
val prompt = """
당신은 한국 패션/의류 커머스 검색 전문가입니다.
다음 규칙을 따르세요:
- 브랜드명 한글/영문 표기는 EQUIVALENT
- 오타/약어는 ONEWAY (오타 => 정확한 표현)
- 전혀 다른 브랜드는 동의어로 묶지 마세요
- 카테고리가 다른 상품명은 동의어로 묶지 마세요
...
"""
```

### 관찰 포인트
- 도메인 규칙 명시 전후로 오분류가 줄어드는가?
- `나이키`와 `아디다스`를 실수로 묶는 경우가 발생하는가?

---

## 실험 6-4. 배치 크기 실험

현재 배치 크기: 500개. 너무 많으면 LLM이 맥락을 잃음.

```bash
# 배치 크기별 품질 비교
# GenerateSynonymRequest에 batchSize 파라미터 추가 후 실험
100개 배치 vs 300개 배치 vs 500개 배치
```

### 예상 결과
- 배치 크기 줄수록 품질 UP, 비용 UP
- 적정 배치 크기는 모델과 토큰 한도에 따라 다름

---

## 실험 6-5. Gemini 2.5 Flash Lite 특성 파악

현재 모델: `gemini-2.5-flash-lite`

```bash
# 응답 속도 측정
time curl -X POST "http://localhost:8080/api/v1/synonyms/generate" \
  -d '{"indexName": "products", "fields": ["brand"], "sampleSize": 50}'
```

### Gemini 특성 확인
- JSON 형식 응답 안정성 (코드펜스 제거 후 파싱 성공률)
- 한국어 커머스 용어 이해도
- temperature 0.1 vs 0.3 vs 0.7 결과 다양성 차이

### temperature 실험

```kotlin
// LlmConfig 또는 프롬프트 호출 시 temperature 변경
options.temperature = 0.1  // 결정론적, 일관성 높음
options.temperature = 0.5  // 적당한 다양성
options.temperature = 0.9  // 창의적이지만 불안정
```

관찰: 동의어 생성에는 낮은 temperature가 유리한가?

---

## 실험 6-6. LLM-as-a-Judge 평가 품질 검증

`RelevancePromptTemplate.kt` — 검색 결과의 관련성을 LLM이 판단.

```bash
# 평가 실행 후 LLM 판단과 사람 판단 비교
curl -X POST "http://localhost:8080/api/v1/evaluation/run" \
  -d '{"indexName": "products", "querySetId": "golden", "configLabel": "llm-judge-test"}'
```

### 검증 방법
1. 쿼리 10개 선택
2. 각 쿼리에 대해 LLM이 매긴 관련성 점수(0~3) 확인
3. 본인이 직접 같은 결과에 점수 부여
4. 일치율(Kendall's τ) 측정

### 관찰 포인트
- few-shot 예시가 있는 프롬프트가 더 일관성 있는가?
- "삼성 갤럭시"를 검색했을 때 "갤럭시탭"을 relevance 2로 판단하는가, 아니면 1인가?

---

## 핵심 개념 정리

| 개념 | 내 이해 |
|------|--------|
| Zero-shot vs Few-shot 차이 | |
| Temperature가 생성 다양성에 미치는 영향 | |
| JSON 파싱 실패 시 retry 전략의 의미 | |
| LLM-as-a-Judge의 한계 | |
| 배치 크기와 컨텍스트 창의 관계 | |
