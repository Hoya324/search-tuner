> korean-search-tuner의 프론트엔드 워크스페이스와 REST API 상세 명세
> 

---

## 1. 프론트엔드 개요

### 1.1 기술 스택

| Layer | Technology | Reason |
| --- | --- | --- |
| Framework | React 18 + TypeScript | 컴포넌트 기반, 타입 안전 |
| UI Library | shadcn/ui + Tailwind CSS | 깔끔한 대시보드 UI |
| 상태 관리 | TanStack Query (React Query) | 서버 상태 캐싱, 로딩/에러 처리 |
| 차트 | Recharts | 메트릭 시각화 |
| 빌드 | Vite | 빠른 개발 서버 |

### 1.2 전체 네비게이션 구조

```
┌─────────────────────────────────────────────────────┐
│  korean-search-tuner                    [Settings ⚙] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ 🔍 검색   │                                          │
│  테스트   │         (메인 콘텐츠 영역)                 │
│          │                                          │
│ 📖 동의어  │                                          │
│  관리     │                                          │
│          │                                          │
│ 🔧 분석기  │                                          │
│  설정     │                                          │
│          │                                          │
│ 📊 품질   │                                          │
│  평가     │                                          │
│          │                                          │
│ 📦 데이터  │                                          │
│  관리     │                                          │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  Elasticsearch: ● Connected | Docs: 10,000          │
└─────────────────────────────────────────────────────┘
```

---

## 2. 화면별 상세 명세

### 2.1 검색 테스트 (Search Playground)

사용자가 직접 검색어를 입력하고 결과를 확인하면서, 동의어/분석기 설정에 따른 변화를 실시간으로 비교하는 페이지.

```
┌─────────────────────────────────────────────────────────┐
│  🔍 검색 테스트                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────┐  [검색]             │
│  │ 캐구 패딩                        │                    │
│  └─────────────────────────────────┘                    │
│                                                         │
│  검색 설정:  ○ Config A (동의어 없음)                     │
│             ● Config B (AI 동의어 적용)                   │
│             ○ 나란히 비교                                 │
│                                                         │
│  ── 토큰 분석 결과 ──────────────────────────────────    │
│  입력: "캐구 패딩"                                       │
│  Config A 토큰: [캐구] [패딩]                            │
│  Config B 토큰: [캐구] [캐나다구스] [Canada Goose]        │
│                 [패딩] [다운자켓] [다운점퍼]               │
│                                                         │
│  ── 검색 결과 (10건) ──────────────────── Score ──────   │
│                                                         │
│  1. 캐나다구스 남성 롱패딩 자켓               12.45       │
│     Fashion Store | ₩1,290,000 | 패딩                   │
│     매칭: product_name(캐나다구스→캐구 동의어)            │
│                                                         │
│  2. 캐나다구스 여성 숏패딩                     11.82       │
│     Fashion Store | ₩980,000 | 패딩                     │
│     매칭: product_name(캐나다구스→캐구 동의어)            │
│                                                         │
│  3. 캐나다구스 경량 다운자켓                   10.15       │
│     Outdoor Shop | ₩750,000 | 아우터                    │
│     매칭: product_name(캐나다구스) + description(패딩)    │
│                                                         │
│  ── Explain Score (펼치기) ─────────────────────────     │
│  │ BM25(product_name:캐나다구스) = 8.23                  │
│  │ BM25(product_name:패딩) = 4.22                       │
│  │ total = 12.45                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**핵심 기능:**

- 검색어 입력 시 토큰 분석 결과를 실시간으로 보여줌 (_analyze API 활용)
- Config A/B 선택 또는 "나란히 비교" 모드
- 각 검색 결과에 왜 이 점수가 나왔는지 explain 제공
- 동의어 매칭 하이라이트 (어떤 동의어 규칙이 적용되었는지)

### 2.2 동의어 관리 (Synonym Manager)

AI 동의어 생성부터 리뷰, 편집, 적용까지 전체 워크플로우를 관리하는 페이지.

```
┌─────────────────────────────────────────────────────────┐
│  📖 동의어 관리                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [+ AI 동의어 생성]  [파일 업로드]  [현재 사전 다운로드]    │
│                                                         │
│  ── 현재 적용된 동의어 사전 ──── 총 156개 그룹 ───────    │
│  Status: ● 적용됨 (products 인덱스)                      │
│  Last updated: 2026-03-06 12:00                         │
│                                                         │
│  [검색: 동의어 그룹 검색...]                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ #1  캐나다구스, 캐구, Canada Goose               │    │
│  │     Type: EQUIVALENT | Confidence: 0.95          │    │
│  │     Source: AI Generated | Category: fashion     │    │
│  │     [편집] [삭제]                                 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ #2  패딩, 다운자켓, 다운점퍼, 패딩점퍼            │    │
│  │     Type: EQUIVALENT | Confidence: 0.88          │    │
│  │     Source: AI Generated | Category: fashion     │    │
│  │     [편집] [삭제]                                 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ #3  나이키, Nike, NIKE                           │    │
│  │     Type: EQUIVALENT | Confidence: 0.99          │    │
│  │     Source: AI Generated | Category: brand       │    │
│  │     [편집] [삭제]                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── AI 동의어 생성 ─────────────────────────────────     │
│  (생성 버튼 클릭 시 모달 또는 확장 영역)                  │
│                                                         │
│  Index: [products     ▼]                                │
│  Field: [product_name ▼]                                │
│  Category: [fashion   ▼] (optional)                     │
│  Sample Size: [2000   ]                                 │
│                                                         │
│  [생성 시작]                                             │
│                                                         │
│  ── 생성 결과 (리뷰 대기) ── 45개 그룹 ──────────────    │
│                                                         │
│  ┌──┬───────────────────────────────────────┬────────┐  │
│  │✓ │ 캐나다구스, 캐구, Canada Goose         │ 0.95   │  │
│  │✓ │ 패딩, 다운자켓, 다운점퍼               │ 0.88   │  │
│  │✓ │ 나이키, Nike, NIKE                    │ 0.99   │  │
│  │✗ │ 배, 배낭, 백팩                        │ 0.62   │  │
│  │  │ ⚠ 다의어 충돌 가능 (confidence 낮음)   │        │  │
│  │✓ │ 블루투스, 블루투쓰, Bluetooth          │ 0.97   │  │
│  └──┴───────────────────────────────────────┴────────┘  │
│                                                         │
│  ✓ 선택: 42/45개                                        │
│                                                         │
│  적용 전략:  ● Reload (무중단, search_analyzer만)         │
│             ○ Blue-Green (전체 재색인)                    │
│                                                         │
│  [선택한 동의어 적용]  [synonym.txt 다운로드]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**핵심 기능:**

- AI 생성 → 사람 리뷰 → 선택 적용 워크플로우
- confidence가 낮은 항목에 경고 표시
- 체크박스로 적용할 동의어 선택/제외
- Reload vs Blue-Green 전략 선택
- 적용 후 이전 버전과의 diff 표시

### 2.3 분석기 설정 (Analyzer Lab)

Nori 분석기 설정을 실험하고, 여러 설정의 토큰화 결과를 나란히 비교하는 페이지.

```
┌─────────────────────────────────────────────────────────┐
│  🔧 분석기 설정                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [AI 추천 받기]  [커스텀 설정 추가]                        │
│                                                         │
│  ── 테스트 텍스트 ───────────────────────────────────    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 캐나다구스 남성용겨울패딩 무선블루투스이어폰          │    │
│  └─────────────────────────────────────────────────┘    │
│  [분석 실행]                                             │
│                                                         │
│  ── 토큰화 비교 결과 ────────────────────────────────    │
│                                                         │
│  Config A: decompound=none                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [캐나다구스] [남성용겨울패딩] [무선블루투스이어폰]   │    │
│  └─────────────────────────────────────────────────┘    │
│  ⚠ 복합명사 미분리 → 부분 검색 불가                      │
│                                                         │
│  Config B: decompound=discard                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [캐나다] [구스] [남성] [용] [겨울] [패딩]          │    │
│  │ [무선] [블루투스] [이어폰]                         │    │
│  └─────────────────────────────────────────────────┘    │
│  ⚠ "캐나다구스" 고유명사 파괴                            │
│                                                         │
│  Config C: decompound=mixed  ★ AI 추천                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [캐나다구스] [캐나다] [구스] [남성용겨울패딩]       │    │
│  │ [남성] [용] [겨울] [패딩] [무선블루투스이어폰]      │    │
│  │ [무선] [블루투스] [이어폰]                         │    │
│  └─────────────────────────────────────────────────┘    │
│  ✓ 고유명사 보존 + 부분 검색 가능                        │
│                                                         │
│  ── AI 추천 근거 ────────────────────────────────────    │
│  "패션 커머스 도메인에서는 mixed 모드가 적합합니다.        │
│   캐나다구스 같은 브랜드명을 원형으로 보존하면서도          │
│   겨울, 패딩 같은 개별 키워드로도 검색 가능합니다."        │
│                                                         │
│  [Config C를 인덱스에 적용]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.4 품질 평가 (Quality Dashboard)

검색 품질을 측정하고, 설정 변경 전후를 정량적으로 비교하는 대시보드.

```
┌─────────────────────────────────────────────────────────┐
│  📊 품질 평가                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [평가 실행]  [쿼리 세트 관리]  [리포트 내보내기]           │
│                                                         │
│  ── 최근 평가 결과 ─────────────────────────────────     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         nDCG@10 추이 (최근 5회 평가)              │    │
│  │                                                  │    │
│  │  0.9 ┤                              ●            │    │
│  │  0.8 ┤                    ●─────────             │    │
│  │  0.7 ┤          ●────────                        │    │
│  │  0.6 ┤ ●────────                                 │    │
│  │  0.5 ┤                                           │    │
│  │      └──────┬────────┬────────┬────────┬──       │    │
│  │          baseline  +nori  +synonym  +tuning      │    │
│  │                                                  │    │
│  │  nDCG@10: 0.62 → 0.72 → 0.85 → 0.87            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── A/B 비교 ───────────────────────────────────────    │
│                                                         │
│  Config A: [baseline (동의어 없음)     ▼]                │
│  Config B: [v3 (AI 동의어 + mixed)     ▼]                │
│                                                         │
│  [비교 실행]                                             │
│                                                         │
│  ┌──────────────┬──────────┬──────────┬────────────┐    │
│  │ Metric       │ Config A │ Config B │ Change     │    │
│  ├──────────────┼──────────┼──────────┼────────────┤    │
│  │ nDCG@10      │ 0.6234   │ 0.8512   │ +36.6% ▲  │    │
│  │ Precision@5  │ 0.5800   │ 0.8100   │ +39.7% ▲  │    │
│  │ MRR          │ 0.6456   │ 0.8823   │ +36.7% ▲  │    │
│  │ p-value      │          │          │ 0.0012    │    │
│  └──────────────┴──────────┴──────────┴────────────┘    │
│  ✅ 통계적으로 유의한 차이 (p < 0.05)                     │
│                                                         │
│  ── 쿼리별 상세 ────────────────────────────────────     │
│                                                         │
│  개선된 쿼리 (38개)                                      │
│  ┌──────────────────────┬────────┬────────┬────────┐    │
│  │ Query               │ A      │ B      │ Δ      │    │
│  ├──────────────────────┼────────┼────────┼────────┤    │
│  │ "캐구 패딩"          │ 0.31   │ 0.95   │ +206%  │    │
│  │ "블루투쓰 이어폰"     │ 0.45   │ 0.88   │ +96%   │    │
│  │ "나이키 런닝화"       │ 0.52   │ 0.91   │ +75%   │    │
│  └──────────────────────┴────────┴────────┴────────┘    │
│                                                         │
│  악화된 쿼리 (3개) ⚠                                     │
│  ┌──────────────────────┬────────┬────────┬────────┐    │
│  │ "배 과일"            │ 0.82   │ 0.65   │ -21%   │    │
│  │  → 원인: "배"↔"배낭" 동의어 충돌                  │    │
│  └──────────────────────┴────────┴────────┴────────┘    │
│                                                         │
│  ── LLM Judge 신뢰도 ───────────────────────────────    │
│  Cohen's κ = 0.78 (substantial agreement)               │
│  Golden Set 일치율: 82/100                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.5 데이터 관리 (Data Manager)

가게/상품 데이터 관리와 ES 색인 상태를 관리하는 페이지.

```
┌─────────────────────────────────────────────────────────┐
│  📦 데이터 관리                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── MySQL ─────────────────────────────────────────     │
│  가게: 100개 | 상품: 10,000개                            │
│  [상품 목록 보기]  [가게 목록 보기]  [CSV Import]          │
│                                                         │
│  ── Elasticsearch ─────────────────────────────────     │
│  Index: products-v2 (alias: products)                   │
│  Documents: 10,000 | Size: 45.2 MB                     │
│  Status: ● green                                        │
│                                                         │
│  Analyzer: korean_search (nori + mixed + synonym)       │
│  Synonyms: 156 groups (last updated: 2026-03-06)       │
│                                                         │
│  [전체 재색인]  [증분 동기화]  [인덱스 설정 보기]           │
│                                                         │
│  ── 색인 히스토리 ─────────────────────────────────     │
│  ┌────────────┬───────────┬──────────┬──────────┐      │
│  │ Time       │ Type      │ Docs     │ Duration │      │
│  ├────────────┼───────────┼──────────┼──────────┤      │
│  │ 03-06 12:00│ Full      │ 10,000   │ 2m 34s   │      │
│  │ 03-06 11:30│ Synonym   │ -        │ 0.3s     │      │
│  │ 03-05 18:00│ Full (BG) │ 10,000   │ 3m 12s   │      │
│  └────────────┴───────────┴──────────┴──────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. REST API 상세 명세

### 3.1 상품/검색 API

### `GET /api/v1/products`

상품 목록 조회 (MySQL).

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| page | int | N | 0 | 페이지 번호 |
| size | int | N | 20 | 페이지 크기 |
| category | string | N | - | 카테고리 필터 |
| shopId | long | N | - | 가게 ID 필터 |

**Response 200:**

```json
{
  "content": [
    {
      "id": 1001,
      "shopId": 1,
      "shopName": "Fashion Store",
      "name": "캐나다구스 남성 롱패딩 자켓",
      "description": "프리미엄 구스다운 충전 롱패딩",
      "price": 1290000,
      "category": "패딩",
      "brand": "Canada Goose",
      "tags": ["겨울", "아우터", "프리미엄"],
      "status": "ACTIVE",
      "createdAt": "2026-01-15T10:00:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 10000,
  "totalPages": 500
}
```

### `GET /api/v1/products/search`

ES 기반 한국어 상품 검색.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| q | string | **Y** | - | 검색 쿼리 |
| category | string | N | - | 카테고리 필터 |
| minPrice | int | N | - | 최소 가격 |
| maxPrice | int | N | - | 최대 가격 |
| page | int | N | 0 | 페이지 번호 |
| size | int | N | 20 | 페이지 크기 |
| explain | boolean | N | false | 스코어 explain 포함 여부 |

**Response 200:**

```json
{
  "query": "캐구 패딩",
  "totalHits": 45,
  "took": 12,
  "hits": [
    {
      "productId": 1001,
      "shopName": "Fashion Store",
      "productName": "캐나다구스 남성 롱패딩 자켓",
      "description": "프리미엄 구스다운 충전 롱패딩",
      "price": 1290000,
      "category": "패딩",
      "brand": "Canada Goose",
      "score": 12.45,
      "highlights": {
        "productName": ["<em>캐나다구스</em> 남성 롱<em>패딩</em> 자켓"]
      },
      "explain": {
        "description": "sum of:",
        "value": 12.45,
        "details": [
          { "description": "weight(product_name:캐나다구스)", "value": 8.23 },
          { "description": "weight(product_name:패딩)", "value": 4.22 }
        ]
      }
    }
  ],
  "tokenAnalysis": {
    "input": "캐구 패딩",
    "tokens": ["캐구", "캐나다구스", "Canada Goose", "패딩", "다운자켓"]
  }
}
```

### `POST /api/v1/products/search/analyze`

검색어의 토큰 분석 결과만 반환 (검색 실행 없이).

**Request:**

```json
{
  "text": "캐구 패딩",
  "analyzers": ["korean_index", "korean_search"]
}
```

**Response 200:**

```json
{
  "text": "캐구 패딩",
  "results": [
    {
      "analyzer": "korean_index",
      "tokens": [
        { "token": "캐구", "startOffset": 0, "endOffset": 2, "type": "word", "position": 0 },
        { "token": "패딩", "startOffset": 3, "endOffset": 5, "type": "word", "position": 1 }
      ]
    },
    {
      "analyzer": "korean_search",
      "tokens": [
        { "token": "캐구", "startOffset": 0, "endOffset": 2, "type": "word", "position": 0 },
        { "token": "캐나다구스", "startOffset": 0, "endOffset": 2, "type": "SYNONYM", "position": 0 },
        { "token": "Canada Goose", "startOffset": 0, "endOffset": 2, "type": "SYNONYM", "position": 0 },
        { "token": "패딩", "startOffset": 3, "endOffset": 5, "type": "word", "position": 1 },
        { "token": "다운자켓", "startOffset": 3, "endOffset": 5, "type": "SYNONYM", "position": 1 }
      ]
    }
  ]
}
```

### 3.2 색인 관리 API

### `POST /api/v1/index/full`

MySQL → ES 전체 색인 실행.

**Request:**

```json
{
  "indexName": "products",
  "batchSize": 1000
}
```

**Response 202 Accepted:**

```json
{
  "jobId": "idx_20260306_001",
  "status": "STARTED",
  "totalDocuments": 10000,
  "startedAt": "2026-03-06T12:00:00"
}
```

### `GET /api/v1/index/jobs/{jobId}`

색인 작업 상태 조회.

**Response 200:**

```json
{
  "jobId": "idx_20260306_001",
  "status": "INDEXING",
  "progress": { "total": 10000, "indexed": 7500, "percentage": 75 },
  "startedAt": "2026-03-06T12:00:00",
  "estimatedCompletion": "2026-03-06T12:02:30"
}
```

### `POST /api/v1/index/migrate`

Blue-Green Index 전환 실행.

**Request:**

```json
{
  "currentAlias": "products",
  "newIndexSuffix": "v3",
  "settings": { "...새 분석기 설정..." }
}
```

**Response 202 Accepted:**

```json
{
  "migrationId": "mig_20260306_001",
  "status": "CREATED",
  "oldIndex": "products-v2",
  "newIndex": "products-v3",
  "steps": [
    { "step": "CREATE_INDEX", "status": "PENDING" },
    { "step": "BULK_INDEX", "status": "PENDING" },
    { "step": "SWITCH_ALIAS", "status": "PENDING" }
  ]
}
```

### `GET /api/v1/index/migrate/{migrationId}`

Blue-Green 마이그레이션 상태 조회.

**Response 200:**

```json
{
  "migrationId": "mig_20260306_001",
  "status": "INDEXING",
  "oldIndex": "products-v2",
  "newIndex": "products-v3",
  "progress": { "total": 10000, "indexed": 7500, "percentage": 75 },
  "steps": [
    { "step": "CREATE_INDEX", "status": "COMPLETED", "completedAt": "..." },
    { "step": "BULK_INDEX", "status": "IN_PROGRESS", "progress": 75 },
    { "step": "SWITCH_ALIAS", "status": "PENDING" }
  ]
}
```

### `POST /api/v1/index/migrate/{migrationId}/rollback`

Blue-Green 마이그레이션 롤백.

**Response 200:**

```json
{
  "migrationId": "mig_20260306_001",
  "status": "ROLLED_BACK",
  "restoredIndex": "products-v2",
  "deletedIndex": "products-v3"
}
```

### 3.3 동의어 관리 API

### `POST /api/v1/synonyms/generate`

AI 동의어 사전 자동 생성.

**Request:**

```json
{
  "indexName": "products",
  "fieldName": "product_name",
  "sampleSize": 2000,
  "category": "fashion",
  "confidenceThreshold": 0.7
}
```

**Response 200:**

```json
{
  "id": "syn_20260306_001",
  "status": "COMPLETED",
  "generatedAt": "2026-03-06T12:00:00",
  "totalGroups": 45,
  "acceptedGroups": 42,
  "rejectedGroups": 3,
  "synonymGroups": [
    {
      "id": "sg_001",
      "terms": ["캐나다구스", "캐구", "Canada Goose"],
      "type": "EQUIVALENT",
      "confidence": 0.95,
      "category": "brand",
      "reasoning": "캐나다구스의 한국 소비자 줄임말과 영문 브랜드명",
      "status": "PENDING_REVIEW"
    },
    {
      "id": "sg_002",
      "terms": ["배", "배낭", "백팩"],
      "type": "EQUIVALENT",
      "confidence": 0.62,
      "category": "bag",
      "reasoning": "배낭의 줄임말이지만, 과일 '배'와 충돌 가능",
      "status": "FLAGGED",
      "warning": "다의어 충돌 가능. 수동 리뷰 권장."
    }
  ],
  "llmUsage": {
    "model": "gpt-4o-mini",
    "totalTokens": 42000,
    "estimatedCost": "$0.06"
  }
}
```

### `PATCH /api/v1/synonyms/{synonymSetId}/groups/{groupId}`

개별 동의어 그룹 편집/승인/거부.

**Request:**

```json
{
  "status": "APPROVED",
  "terms": ["캐나다구스", "캐구", "Canada Goose", "캐나다구스패딩"]
}
```

### `POST /api/v1/synonyms/{synonymSetId}/apply`

동의어 사전을 ES 인덱스에 적용.

**Request:**

```json
{
  "strategy": "RELOAD",
  "indexName": "products",
  "groupIds": ["sg_001", "sg_003", "sg_005"],
  "includeExisting": true
}
```

**Response 200:**

```json
{
  "applied": true,
  "strategy": "RELOAD",
  "indexName": "products",
  "appliedGroups": 42,
  "reloadedAt": "2026-03-06T12:05:00",
  "previousVersion": "syn_20260305_003",
  "currentVersion": "syn_20260306_001",
  "diff": {
    "added": 12,
    "modified": 3,
    "removed": 0
  }
}
```

### `GET /api/v1/synonyms/{synonymSetId}/download`

synonym.txt 파일 다운로드.

**Response 200 (text/plain):**

```
캐나다구스,캐구,Canada Goose
패딩,다운자켓,다운점퍼,패딩점퍼
나이키,Nike,NIKE
블루투스,블루투쓰,Bluetooth
```

### 3.4 분석기 추천 API

### `POST /api/v1/analyzer/recommend`

AI 분석기 설정 추천.

**Request:**

```json
{
  "indexName": "products",
  "fieldName": "product_name",
  "sampleSize": 100,
  "domain": "fashion"
}
```

**Response 200:**

```json
{
  "recommendation": "mixed",
  "reasoning": "패션 커머스에서는 mixed 모드가 적합합니다. 브랜드명(캐나다구스)을 원형 보존하면서도 겨울, 패딩 같은 개별 키워드 검색이 가능합니다.",
  "tradeoffs": "인덱스 크기가 discard 대비 약 20% 증가합니다.",
  "configs": [
    {
      "name": "none",
      "settings": { "decompound_mode": "none" },
      "pros": "고유명사 완벽 보존",
      "cons": "복합명사 부분 검색 불가",
      "score": 0.6
    },
    {
      "name": "discard",
      "settings": { "decompound_mode": "discard" },
      "pros": "부분 검색 최적",
      "cons": "고유명사 파괴 (캐나다+구스)",
      "score": 0.7
    },
    {
      "name": "mixed",
      "settings": { "decompound_mode": "mixed" },
      "pros": "고유명사 보존 + 부분 검색 가능",
      "cons": "인덱스 크기 증가",
      "score": 0.9,
      "recommended": true
    }
  ]
}
```

### `POST /api/v1/analyzer/compare`

여러 분석기 설정으로 동일 텍스트 토큰화 비교.

**Request:**

```json
{
  "texts": [
    "캐나다구스 남성용겨울패딩",
    "무선블루투스이어폰 갓성비",
    "나이키 에어맥스 런닝화"
  ],
  "configs": [
    { "name": "none", "decompoundMode": "none", "posFilter": [] },
    { "name": "discard", "decompoundMode": "discard", "posFilter": ["E", "J"] },
    { "name": "mixed", "decompoundMode": "mixed", "posFilter": ["E", "J"] }
  ]
}
```

**Response 200:**

```json
{
  "comparisons": [
    {
      "text": "캐나다구스 남성용겨울패딩",
      "results": [
        { "config": "none", "tokens": ["캐나다구스", "남성용겨울패딩"] },
        { "config": "discard", "tokens": ["캐나다", "구스", "남성", "겨울", "패딩"] },
        { "config": "mixed", "tokens": ["캐나다구스", "캐나다", "구스", "남성용겨울패딩", "남성", "겨울", "패딩"] }
      ]
    }
  ]
}
```

### 3.5 검색 품질 평가 API

### `POST /api/v1/evaluation/run`

검색 품질 평가 실행.

**Request:**

```json
{
  "configLabel": "v3-with-synonyms",
  "querySetId": "golden-100",
  "indexName": "products",
  "topK": 10,
  "scoringMethod": "GOLDEN_SET",
  "llmFallback": true
}
```

`scoringMethod` 옵션:

- `GOLDEN_SET`: Golden Query Set의 human label로 채점 (비용 0, 결정적)
- `LLM_JUDGE`: LLM이 채점 (커스텀 쿼리용)
- `HYBRID`: Golden Set 우선, 없는 쿼리만 LLM (권장)

**Response 200:**

```json
{
  "id": "eval_20260306_001",
  "configLabel": "v3-with-synonyms",
  "querySetId": "golden-100",
  "evaluatedAt": "2026-03-06T12:10:00",
  "metrics": {
    "ndcgAt10": 0.8512,
    "precisionAt5": 0.8100,
    "mrr": 0.8823,
    "queriesEvaluated": 100,
    "scoringMethod": "HYBRID",
    "goldenSetQueries": 95,
    "llmJudgedQueries": 5
  },
  "queryDetails": [
    {
      "queryId": "Q001",
      "query": "캐구 패딩",
      "ndcg": 0.95,
      "topResults": [
        { "rank": 1, "productName": "캐나다구스 남성 롱패딩", "relevance": 3, "source": "GOLDEN_SET" },
        { "rank": 2, "productName": "캐나다구스 여성 숏패딩", "relevance": 3, "source": "GOLDEN_SET" }
      ]
    }
  ]
}
```

### `POST /api/v1/evaluation/compare`

두 설정 간 A/B 비교.

**Request:**

```json
{
  "configA": "baseline",
  "configB": "v3-with-synonyms",
  "querySetId": "golden-100"
}
```

**Response 200:**

```json
{
  "id": "cmp_20260306_001",
  "configA": "baseline",
  "configB": "v3-with-synonyms",
  "overall": {
    "ndcgAt10": { "a": 0.6234, "b": 0.8512, "delta": 0.2278, "deltaPercent": 36.6, "improved": true },
    "precisionAt5": { "a": 0.5800, "b": 0.8100, "delta": 0.2300, "deltaPercent": 39.7, "improved": true },
    "mrr": { "a": 0.6456, "b": 0.8823, "delta": 0.2367, "deltaPercent": 36.7, "improved": true },
    "statisticalSignificance": {
      "testMethod": "paired_t_test",
      "pValue": 0.0012,
      "significant": true,
      "confidenceLevel": 0.95
    }
  },
  "improved": [
    { "queryId": "Q001", "query": "캐구 패딩", "ndcgA": 0.31, "ndcgB": 0.95, "delta": "+206%" },
    { "queryId": "Q015", "query": "블루투쓰 이어폰", "ndcgA": 0.45, "ndcgB": 0.88, "delta": "+96%" }
  ],
  "degraded": [
    {
      "queryId": "Q042", "query": "배 과일", "ndcgA": 0.82, "ndcgB": 0.65, "delta": "-21%",
      "cause": "동의어 '배'↔'배낭' 충돌로 관련 없는 상품이 상위 노출"
    }
  ],
  "unchanged": 59,
  "llmJudgeReliability": {
    "cohensKappa": 0.78,
    "spearmanRho": 0.85,
    "goldenSetAgreement": "82/100"
  }
}
```

### `GET /api/v1/evaluation/query-sets`

등록된 쿼리 세트 목록 조회.

**Response 200:**

```json
{
  "querySets": [
    {
      "id": "golden-100",
      "name": "Golden Query Set v1.0",
      "description": "100개 쿼리, TREC-DL 4-point scale, human labeled",
      "queryCount": 100,
      "categories": ["brand", "abbreviation", "compound", "typo", "ambiguous", "general"],
      "builtIn": true
    },
    {
      "id": "custom-fashion",
      "name": "Fashion Domain Queries",
      "queryCount": 30,
      "builtIn": false,
      "createdAt": "2026-03-05T10:00:00"
    }
  ]
}
```

### `POST /api/v1/evaluation/query-sets`

커스텀 쿼리 세트 등록.

**Request:**

```json
{
  "name": "Fashion Domain Queries",
  "queries": [
    { "query": "캐구 패딩", "intent": "캐나다구스 브랜드 패딩 검색" },
    { "query": "나이키 조던", "intent": "나이키 에어조던 시리즈 검색" }
  ]
}
```

---

## 4. User Flow 요약

```
1. docker compose up → 전체 환경 구동 (MySQL + ES + App)
       ↓
2. [데이터 관리] 샘플 데이터 확인 (10,000 상품 자동 로드)
       ↓
3. [검색 테스트] "캐구 패딩" 검색 → 결과 없음 (동의어 없으므로)
       ↓
4. [품질 평가] baseline 평가 실행 → nDCG@10 = 0.62
       ↓
5. [동의어 관리] AI 동의어 생성 → 45개 그룹 생성 → 리뷰 → 42개 승인
       ↓
6. [동의어 관리] Reload 전략으로 적용 (무중단)
       ↓
7. [검색 테스트] "캐구 패딩" 다시 검색 → 캐나다구스 상품 검색됨!
       ↓
8. [품질 평가] 적용 후 평가 실행 → nDCG@10 = 0.85 (+36.6%, p=0.001)
       ↓
9. [품질 평가] A/B 비교 리포트 확인 → 개선/악화 쿼리 분석
       ↓
10. [동의어 관리] 악화 원인("배" 충돌) 확인 → 해당 동의어 제거 → 재적용
```