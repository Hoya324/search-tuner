# Technical Solutions — Korean Search Tuner

> korean-search-tuner의 두 가지 핵심 기술 과제에 대한 솔루션 문서

---

## Problem 1: 기존 대비 얼마나 나아졌는지 확실하고 공신력 있는 비교

### 1.1 왜 어려운가

"동의어 사전을 AI로 만들었더니 좋아졌습니다"라는 주장은 아무 의미가 없다. 면접에서든 오픈소스 README에서든, **정량적이고 재현 가능한 수치**가 있어야 설득력이 생긴다.

기존 방식의 문제는 검색 품질을 측정하는 표준화된 방법 자체가 없다는 것이다. QA팀이 "이거 좀 이상한데요"라고 엑셀에 적는 게 전부다. 따라서 해결해야 할 건 두 가지다:

1. **검색 품질을 숫자로 측정하는 파이프라인** 자체를 만드는 것
2. 그 측정이 **학술적으로 인정되는 방법론**에 기반하는 것

### 1.2 솔루션: 3-Layer Evaluation Pipeline

```
Layer 1: Golden Query Set (사람이 만든 정답 데이터)
    ↓
Layer 2: Automated Scoring (LLM-as-a-Judge + 자동 메트릭)
    ↓
Layer 3: Statistical Validation (통계적 유의성 검증)
```

### Layer 1: Golden Query Set

**핵심 아이디어**: 검색 품질 비교의 공신력은 "어떤 데이터로 평가했느냐"에서 온다. 프로젝트에 **공개된 평가용 쿼리 세트**를 내장한다.

```yaml
# evaluation/golden_query_set.yaml
queries:
  - id: "Q001"
    query: "캐구 패딩"
    intent: "캐나다구스 브랜드 패딩 상품 검색"
    expected_relevant:
      - product_id: 1001  # 캐나다구스 남성 롱패딩
        relevance: 3       # perfectly relevant
      - product_id: 1002  # 캐나다구스 여성 숏패딩
        relevance: 3
      - product_id: 2001  # 노스페이스 다운패딩
        relevance: 1       # partially relevant (패딩이지만 다른 브랜드)
    expected_irrelevant:
      - product_id: 3001  # 여성 캐시미어 코트
        relevance: 0

  - id: "Q002"
    query: "블루투쓰 이어폰"
    intent: "블루투스 무선 이어폰 검색 (오타 포함)"
    expected_relevant:
      - product_id: 5001  # 소니 WF-1000XM5 블루투스 이어폰
        relevance: 3
      - product_id: 5002  # 에어팟 프로 2세대
        relevance: 2       # 블루투스 이어폰이지만 "블루투스"라는 단어 없음
```

**이 데이터가 공신력을 갖는 이유:**

- TREC (Text REtrieval Conference)에서 사용하는 것과 동일한 형식. TREC-DL 2023의 4-point scale (0~3)을 따른다
- Golden set은 GitHub에 공개되어 누구나 검증/확장할 수 있다
- 각 쿼리에 "intent"를 명시하여 평가 기준이 투명하다

**Golden Query Set 구성 전략:**

| Category | Query Count | Examples |
|----------|------------|---------|
| 브랜드 동의어 (한글/영문) | 20개 | "나이키 운동화", "Nike shoes" |
| 줄임말/신조어 | 15개 | "캐구 패딩", "갓성비 청소기" |
| 복합명사 | 15개 | "무선블루투스이어폰", "남성용겨울장갑" |
| 오타 | 10개 | "블루투쓰", "에어팟프로" |
| 카테고리 모호성 | 10개 | "배" (과일 vs 배낭), "크림" (화장품 vs 식품) |
| 일반 키워드 | 30개 | "겨울 코트", "무선 충전기" |
| **Total** | **100개** | |

### Layer 2: Automated Scoring

두 가지 채점 방식을 병행한다:

**방식 A — Golden Set 기반 자동 채점 (Human Label)**

Golden Query Set에 이미 사람이 매긴 relevance label이 있으므로, ES 검색 결과의 순서와 Golden label을 비교하여 메트릭을 산출한다. LLM이 개입하지 않으므로 비용이 0이고 결과가 결정적(deterministic)이다.

```
nDCG@10 = Σ(relevance_score / log2(rank + 1)) / ideal_DCG

Input: 쿼리 "캐구 패딩"에 대한 ES 검색 결과 top-10
  → rank 1: product 1001 (golden label: 3) ✓
  → rank 2: product 3001 (golden label: 0) ✗
  → rank 3: product 1002 (golden label: 3) ✓
  → ...

Output: nDCG@10 = 0.82
```

**방식 B — LLM-as-a-Judge (Golden Set에 없는 쿼리용)**

사용자가 자신의 커스텀 쿼리를 평가하고 싶을 때, Golden Set에 해당 쿼리가 없으면 LLM이 relevance를 채점한다. 이때 Golden Set의 채점 결과와 LLM 채점 결과의 **일치율(Cohen's Kappa)**을 함께 보여줘서, LLM Judge의 신뢰도를 투명하게 공개한다.

```
[LLM Judge 신뢰도 검증]

Golden Set 100 쿼리에 대해:
- Human label vs LLM label 일치율: Cohen's κ = 0.78
- Spearman 상관계수: ρ = 0.85

→ "이 LLM Judge는 사람 평가와 78% 일치합니다"를 리포트에 표시
```

### Layer 3: Statistical Validation

"설정 A의 nDCG가 0.72이고 설정 B가 0.78이면, B가 정말 더 좋은 건가?"에 대한 답. 통계적 유의성 검증 없이는 말할 수 없다.

**Paired t-test (또는 Wilcoxon signed-rank test):**

```
H0: 설정 A와 설정 B의 쿼리별 nDCG 차이 = 0
H1: 차이 ≠ 0

100개 쿼리 각각에 대해:
  diff[i] = nDCG_B[i] - nDCG_A[i]

p-value < 0.05 → "설정 B가 통계적으로 유의하게 더 좋다"
p-value >= 0.05 → "차이가 통계적으로 유의하지 않다"
```

**이게 면접에서 강력한 이유:**

면접관이 "AI로 동의어 만들었는데 얼마나 좋아졌어요?"라고 물으면, "Golden Query Set 100개에 대해 nDCG@10이 0.72에서 0.85로 18% 향상되었고, paired t-test에서 p-value 0.003으로 통계적으로 유의합니다"라고 답할 수 있다. 이건 대부분의 현업 검색팀도 안 하는 수준의 평가다.

### 1.3 비교 리포트 출력 형태

```
╔══════════════════════════════════════════════════╗
║        Search Quality Comparison Report          ║
║        Config A (baseline) vs Config B (+synonym)║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Overall Metrics                                 ║
║  ┌────────────┬──────────┬──────────┬─────────┐  ║
║  │ Metric     │ Config A │ Config B │ Δ       │  ║
║  ├────────────┼──────────┼──────────┼─────────┤  ║
║  │ nDCG@10    │ 0.7234   │ 0.8512   │ +17.7%  │  ║
║  │ P@5        │ 0.6800   │ 0.8100   │ +19.1%  │  ║
║  │ MRR        │ 0.7456   │ 0.8823   │ +18.3%  │  ║
║  │ p-value    │          │          │ 0.003   │  ║
║  └────────────┴──────────┴──────────┴─────────┘  ║
║                                                  ║
║  → 통계적으로 유의한 차이 (p < 0.05)              ║
║                                                  ║
║  Top 5 Improved Queries                          ║
║  1. "캐구 패딩"       0.31 → 0.95  (+206%)      ║
║  2. "블루투쓰 이어폰"  0.45 → 0.88  (+96%)       ║
║  3. "나이키 런닝화"    0.52 → 0.91  (+75%)       ║
║  4. "갓성비 무선청소기" 0.38 → 0.72  (+89%)      ║
║  5. "에어팟 케이스"    0.61 → 0.85  (+39%)       ║
║                                                  ║
║  Top 3 Degraded Queries (주의 필요)               ║
║  1. "배 과일"         0.82 → 0.65  (-21%)       ║
║     → 원인: "배"가 "배낭"과 동의어로 묶임         ║
║  2. "크림"            0.78 → 0.71  (-9%)        ║
║     → 원인: 화장품/식품 크림 동의어 충돌           ║
║                                                  ║
║  LLM Judge Reliability                           ║
║  Cohen's κ = 0.78 (substantial agreement)        ║
║  Spearman ρ = 0.85                               ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

---

## Problem 2: ES 동의어 동적 업데이트 — 다운타임 제로

### 2.1 왜 어려운가

Elasticsearch에서 동의어 사전을 변경하는 일반적인 방법:

```
1. 인덱스 close (이 동안 검색 불가 ← 치명적)
2. settings update (synonym 파일 변경)
3. 인덱스 open
```

운영 환경에서 검색이 수초~수분이라도 안 되면 장애다. 무신사가 S3에 사전 파일을 올리고 1분마다 동기화하는 것도 이 문제를 우회하기 위한 것이다.

### 2.2 솔루션: Reload + Blue-Green Index 전략

두 가지 전략을 모두 지원한다. 상황에 따라 선택할 수 있다.

### 전략 A: Search-time Synonym + Reload API (경량, 권장)

ES 8.x에서는 동의어를 **search_analyzer에만 적용**하고, `updateable: true`로 설정하면 인덱스를 닫지 않고 동의어를 reload할 수 있다.

```
핵심 원리:
- index_analyzer: 동의어 없이 순수 Nori만 적용 (색인 시점)
- search_analyzer: 동의어 포함 (검색 시점) + updateable: true

동의어 변경 시:
1. synonym 파일을 ES 노드에 업데이트
2. POST /{index}/_reload_search_analyzers 호출
3. 다운타임 없이 즉시 적용
```

**인덱스 설정:**

```json
{
  "settings": {
    "analysis": {
      "filter": {
        "synonym_filter": {
          "type": "synonym",
          "synonyms_path": "synonyms/product_synonyms.txt",
          "updateable": true
        }
      },
      "analyzer": {
        "korean_index": {
          "type": "custom",
          "tokenizer": "nori_mixed",
          "filter": ["lowercase", "nori_part_of_speech"]
        },
        "korean_search": {
          "type": "custom",
          "tokenizer": "nori_mixed",
          "filter": ["lowercase", "nori_part_of_speech", "synonym_filter"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "product_name": {
        "type": "text",
        "analyzer": "korean_index",
        "search_analyzer": "korean_search"
      }
    }
  }
}
```

**동의어 업데이트 흐름:**

```
1. korean-search-tuner가 synonym.txt 생성
       ↓
2. 파일을 ES 노드의 config/synonyms/ 경로에 저장
   (Docker volume mount로 외부에서 접근 가능)
       ↓
3. POST /products/_reload_search_analyzers 호출
       ↓
4. ES가 search_analyzer만 reload
   (검색 중단 없음, 색인 중단 없음)
       ↓
5. 다음 검색부터 새 동의어 적용
```

**제약사항:**

- search_analyzer에만 적용 가능. index_analyzer의 동의어는 이 방법으로 변경 불가
- 하지만 검색 품질 관점에서 search-time synonym이 더 유연하고 관리가 쉽다. 색인 시점 동의어는 사전 변경 시 전체 reindex가 필요하므로 실무에서도 search-time을 권장
- ES 7.x에서는 `updateable` 옵션 미지원. 7.x 사용자는 전략 B를 써야 한다

### 전략 B: Blue-Green Index (무중단 전환, 대규모 변경용)

분석기 설정 자체를 변경하거나, index-time 동의어를 바꿔야 할 때 사용한다.

```
1. 현재 운영 인덱스: products-v1 (alias: products → products-v1)

2. 새 설정으로 인덱스 생성: products-v2
   (새 동의어 사전, 새 분석기 설정 적용)

3. MySQL 데이터를 products-v2에 전체 색인
   (이 동안 products-v1이 계속 검색 서빙)

4. 색인 완료 후 alias 전환:
   POST /_aliases
   {
     "actions": [
       { "remove": { "index": "products-v1", "alias": "products" } },
       { "add":    { "index": "products-v2", "alias": "products" } }
     ]
   }

5. alias 전환은 atomic operation → 다운타임 0

6. products-v1은 롤백용으로 보관 후 삭제
```

**이 전략의 장점:**

- 어떤 설정 변경이든 적용 가능 (분석기, 매핑, 동의어 전부)
- alias 전환이 atomic이므로 다운타임이 물리적으로 0
- 문제 발생 시 alias를 다시 v1으로 돌리면 즉시 롤백

**이 전략의 비용:**

- 색인 중 디스크와 메모리를 2배 사용
- 전체 reindex 시간 필요 (10만 건 기준 수분)

### 전략 선택 가이드

| 변경 유형 | 권장 전략 | 이유 |
|----------|----------|------|
| 동의어 사전 파일만 변경 | **전략 A (Reload)** | ~1초, 검색 중단 없음 |
| 분석기 설정 변경 (decompound_mode 등) | **전략 B (Blue-Green)** | 설정 변경이 색인 시점에 적용되어야 함 |
| 매핑 변경 (새 필드 추가 등) | **전략 B (Blue-Green)** | ES는 기존 매핑 변경 불가 |
| 전체 재색인 필요 | **전략 B (Blue-Green)** | 전환 중에도 검색 서빙 유지 |
