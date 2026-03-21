# PRD — Korean Search Tuner

**AI-Powered Korean Search Quality Optimizer for Elasticsearch**

> v1.1 | 2026.03 | Kotlin · Spring Boot · Hexagonal Architecture

---

## 1. Project Overview

### 1.1 Problem Statement

Elasticsearch를 사용하는 국내 커머스 기업들은 한국어 검색 품질 개선에 반복적인 수동 작업을 투입하고 있다.

- 동의어 사전을 수천 줄의 텍스트 파일(synonym.txt)로 수동 관리 (무신사: S3에 올려 1분마다 노드 동기화)
- 형태소 분석기 설정(Nori decompound_mode, 품사 필터)을 시행착오로 결정 (오늘의집: '&' 포함 신조어로 인덱스 생성 실패)
- 검색 품질 평가를 QA팀이 엑셀로 수동 수행 (배민: 5천만 건 상품에서 슬로우 쿼리 발생)
- 신조어/트렌드 키워드 대응이 구조적으로 지연 (오늘의집: "변경의 굴레")

이 문제는 배달의민족, 무신사, 오늘의집, 아임웹, 핏펫, Spoqa 등 국내 기술 블로그에서 반복적으로 보고되는 공통 페인포인트이다.

### 1.2 Solution

korean-search-tuner는 **실제 커머스 검색 시스템(가게-상품 DB → ES 색인 → 검색)**을 내장하고, 그 위에 LLM 기반 검색 품질 자동화 도구를 얹은 오픈소스 프로젝트이다.

단순한 유틸리티 라이브러리가 아니라, **Docker Compose 한 번으로 커머스 검색 시스템 + AI 튜닝 도구가 함께 뜨는 완전한 데모 환경**을 제공한다.

### 1.3 Target Users

- Elasticsearch를 사용하는 백엔드 개발자 (주로 커머스 도메인)
- 검색 품질을 개선하고 싶지만 전담 검색 엔지니어가 없는 중소 규모 팀
- MySQL LIKE 검색에서 ES로 전환하는 초기 단계의 팀

### 1.4 Key Differentiator

| 기존 도구 | korean-search-tuner |
|---------|-------------------|
| Haystack, LangChain: ES를 단순 vector store로만 사용 | ES의 네이티브 기능(Nori, 동의어, function_score)을 직접 최적화 |
| ES 관련 오픈소스: AI 통합 부재 | LLM 기반 동의어 생성, 분析기 추천, 품질 평가 자동화 |
| 대부분 Python 생태계 | Kotlin + Spring Boot — 국내 백엔드 개발자에게 친숙한 스택 |
| 도구만 제공 | 가게-상품 데모 데이터 + 검색 시스템까지 포함한 완전한 환경 |

---

## 2. Pain Points: 국내 기술 블로그 근거

### 2.1 동의어 사전 수동 관리

| Company | Pain Point | Source |
|---------|-----------|--------|
| 무신사 | 각 팀별로 S3에 사용자/동의어/금칙어 사전을 텍스트 파일로 업로드, 1분마다 ES 노드 동기화 | MUSINSA tech blog |
| 무신사 | "레이스 양말" 검색 시 동의어 "삭스" 때문에 삭스 부츠가 상위 노출 | MUSINSA tech blog |
| 오늘의집 | 형태소 분析기에 신조어 등록, 사전·가중치·쿼리 끝없이 변경하는 "변경의 굴레" | 오늘의집 블로그 |
| 일반 | 색인 시점 동의어 적용 시 변경마다 reindex 필요, "배"→"사과"/"선반" 다의어 충돌 | velog 기술 포스트 |

### 2.2 Nori 형태소 분析기 설정 삽질

| Company | Pain Point | Source |
|---------|-----------|--------|
| 하나몬 | "실력있는 조직" 검색 → "나는 궁금해 당신의 모든것" 매칭 (조사 "는"이 걸림) | 하나몬 블로그 |
| 오늘의집 | '&' 포함 신조어가 Nori에 의해 비정상 분석 → 동의어 생성 자체 실패 | 오늘의집 블로그 |
| lesstif | "지리산"→"지리"+"산" 분리, "남악제"→"제" 탈락 | lesstif 기술 노트 |

### 2.3 MySQL LIKE → ES 전환 시 초기 설정 난이도

| Company | Pain Point | Source |
|---------|-----------|--------|
| velog 개발자 | "ES+Logstash 세팅이 제일 어려웠다, 2~3시간 생각했는데 1주일 넘게 걸림" | velog 기술 포스트 |
| 아임웹 | 와일드카드 → N-gram 전환으로 latency 1,000ms에서 대폭 감소, 하지만 최적 토크나이저 선택이 어려움 | imweb tech blog |
| 핏펫 | SQL LIKE 검색의 속도 이슈로 ES 도입 결정, Score 향상 쿼리 방법 다양하지만 러닝커브 높음 | Fitpet blog |

### 2.4 검색 스코어링 튜닝

| Company | Pain Point | Source |
|---------|-----------|--------|
| 배달의민족 | 상품 1천만→5천만 건 증가, function_score 중복 필터로 슬로우 쿼리 발생 | 우아한형제들 기술블로그 |
| 배달의민족 | 가게-메뉴 관계를 query-time→nested document로 변경하여 80% latency 개선 | 우아한형제들 기술블로그 |

---

## 3. System Architecture

### 3.1 Overall System (Docker Compose)

```
docker compose up 한 번으로 전체 환경 구동

┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
│                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │  MySQL    │    │  search-tuner    │    │Elasticsearch │  │
│  │          │───→│  (Spring Boot)   │───→│  + Nori      │  │
│  │ 가게/상품 │    │                  │    │  + 동의어     │  │
│  │ DB       │    │  - 상품 API      │    │              │  │
│  └──────────┘    │  - 검색 API      │    └──────────────┘  │
│                  │  - 색인 API      │                       │
│                  │  - 동의어 생성   │                       │
│                  │  - 분析기 추천   │                       │
│                  │  - 품질 평가     │                       │
│                  └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 커머스 검색 시스템 아키텍처 (내장)

```
[Client]
   │
   ▼
[Search API]  ──검색 요청──→  [Elasticsearch]
   │                              ▲
   │                              │ 색인
   │                              │
[Product API] ──CRUD──→ [MySQL] ──→ [Indexing Service]
   │                                     │
   │                              ┌──────┴──────┐
   │                              │   Nori 分析器  │
   │                              │   동의어 사전  │
   │                              │   사용자 사전  │
   │                              └─────────────┘
   │
   ▼
★ [Tuner API] ── AI 튜닝 도구 ──
   │
   ├── POST /api/v1/synonyms/generate     → 동의어 자동 생성
   ├── POST /api/v1/analyzer/recommend    → 分析器 설정 추천
   ├── POST /api/v1/evaluation/run        → 검색 품질 자동 평가
   └── POST /api/v1/evaluation/compare    → A/B 설정 비교
```

---

## 4. Database Schema (가게-상품)

### 4.1 ERD

```
┌─────────────────────┐       ┌─────────────────────────────┐
│       shop           │       │         product              │
├─────────────────────┤       ├─────────────────────────────┤
│ id          BIGINT PK│  1:N  │ id              BIGINT PK   │
│ name        VARCHAR  │◄─────│ shop_id          BIGINT FK   │
│ category    VARCHAR  │       │ name             VARCHAR     │
│ address     VARCHAR  │       │ description      TEXT        │
│ latitude    DECIMAL  │       │ price            INT         │
│ longitude   DECIMAL  │       │ category         VARCHAR     │
│ rating      DECIMAL  │       │ brand            VARCHAR     │
│ is_open     BOOLEAN  │       │ tags             VARCHAR     │
│ created_at  DATETIME │       │ status           VARCHAR     │
│ updated_at  DATETIME │       │ created_at       DATETIME    │
└─────────────────────┘       │ updated_at       DATETIME    │
                               └─────────────────────────────┘

┌─────────────────────────────┐  ┌──────────────────────────────┐
│      synonym_dictionary      │  │      evaluation_result        │
├─────────────────────────────┤  ├──────────────────────────────┤
│ id            BIGINT PK      │  │ id              BIGINT PK    │
│ category      VARCHAR        │  │ config_label    VARCHAR      │
│ terms         TEXT (JSON)    │  │ query_set_id    VARCHAR      │
│ synonym_type  VARCHAR        │  │ ndcg_at_10      DECIMAL      │
│ confidence    DECIMAL        │  │ precision_at_5  DECIMAL      │
│ source        VARCHAR        │  │ mrr             DECIMAL      │
│ created_at    DATETIME       │  │ detail_json     TEXT         │
│ updated_at    DATETIME       │  │ created_at      DATETIME     │
└─────────────────────────────┘  └──────────────────────────────┘
```

### 4.2 Sample Data 설계

Docker 초기 구동 시 자동으로 삽입되는 데모 데이터:

| Entity | Count | Examples |
|--------|-------|---------|
| shop | 100개 | 패션 브랜드숍, 식품점, 전자제품 매장, 생활용품점 등 |
| product | 10,000개 | 각 가게당 평균 100개 상품. 한국어 상품명, 브랜드명(영문/한글 혼용), 신조어, 줄임말 포함 |

상품 데이터의 특징 (한국어 검색 난이도를 의도적으로 포함):

- 동의어가 필요한 상품: "캐나다구스 패딩" / "캐구 다운자켓" / "Canada Goose 점퍼"
- 복합명사: "남성용겨울방한장갑", "무선블루투스이어폰"
- 브랜드 표기 혼용: "나이키" / "Nike" / "NIKE"
- 신조어/줄임말: "갓성비 무선청소기", "가심비 인테리어소품"
- 오타 패턴: "블루투스" / "블루투쓰" / "블루투th"

### 4.3 Elasticsearch Index Mapping

```json
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "nori_mixed": {
          "type": "nori_tokenizer",
          "decompound_mode": "mixed"
        }
      },
      "filter": {
        "synonym_filter": {
          "type": "synonym",
          "synonyms_path": "synonyms/product_synonyms.txt",
          "updateable": true
        }
      },
      "analyzer": {
        "korean_search": {
          "type": "custom",
          "tokenizer": "nori_mixed",
          "filter": ["lowercase", "nori_part_of_speech", "synonym_filter"]
        },
        "korean_index": {
          "type": "custom",
          "tokenizer": "nori_mixed",
          "filter": ["lowercase", "nori_part_of_speech"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "product_id": { "type": "long" },
      "shop_id": { "type": "long" },
      "shop_name": { "type": "keyword" },
      "product_name": {
        "type": "text",
        "analyzer": "korean_index",
        "search_analyzer": "korean_search"
      },
      "description": {
        "type": "text",
        "analyzer": "korean_index",
        "search_analyzer": "korean_search"
      },
      "category": { "type": "keyword" },
      "brand": {
        "type": "text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "tags": { "type": "keyword" },
      "price": { "type": "integer" },
      "shop_rating": { "type": "float" },
      "status": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

---

## 5. Core Features (MVP)

### 5.1 Module 1: 커머스 검색 시스템 (Foundation)

| Feature | Description |
|---------|------------|
| 상품 CRUD API | 가게/상품의 생성, 조회, 수정, 삭제 |
| ES 색인 API | MySQL → ES 전체/증분 색인. 分析器 설정을 동적으로 교체 가능 |
| 상품 검색 API | ES 기반 한국어 상품 검색. BM25 + Nori + 동의어 적용 |
| 검색 결과 | 상품명, 가게명, 가격, 카테고리, relevance score 반환 |

### 5.2 Module 2: 동의어 자동 생성기 (Synonym Auto-Generator)

| Feature | Description |
|---------|------------|
| 데이터 샘플링 | ES 인덱스에서 상품명/설명 필드를 샘플링하여 용어 클러스터 추출 |
| LLM 동의어 판단 | 용어 클러스터를 LLM에 전달하여 동의어 관계 판단 (캐나다구스↔캐구↔Canada Goose) |
| synonym.txt 생성 | ES 호환 포맷으로 출력, 기존 사전과 diff/merge |
| 즉시 적용 | 생성된 사전을 ES 인덱스에 바로 적용 (close/open 또는 updateable synonym) |
| 카테고리별 분리 | 패션/식품/전자제품 등 도메인별 동의어 사전 분리 지원 |

### 5.3 Module 3: 分析器 설정 추천기 (Analyzer Recommender)

| Feature | Description |
|---------|------------|
| 다중 설정 생성 | decompound_mode (none/discard/mixed) × 품사 필터 조합을 자동 생성 |
| 토큰화 비교 | 동일 텍스트를 여러 설정으로 토큰화하고 결과 비교표 제공 |
| LLM 추천 | 도메인 특성을 고려하여 최적 설정 추천 + 근거 설명 |
| 설정 출력 | ES 인덱스 생성용 JSON 설정으로 즉시 적용 가능하게 출력 |

### 5.4 Module 4: 검색 품질 자동 평가기 (Search Quality Evaluator)

| Feature | Description |
|---------|------------|
| 쿼리 세트 등록 | 평가용 쿼리를 CSV 또는 API로 등록 |
| 자동 검색 + 채점 | 각 쿼리에 대해 ES 검색 실행 후 LLM이 query-document relevance를 0~3 스케일로 채점 |
| IR 메트릭 산출 | nDCG@10, Precision@K, MRR 자동 계산 |
| A/B 비교 리포트 | 설정 A vs B 적용 시 어떤 쿼리에서 개선/악화되었는지 상세 분석 |

---

## 6. Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Language | **Kotlin** | Null safety, data class, coroutines, Spring 공식 지원 |
| Framework | **Spring Boot 3.x** | Auto-configuration, 멀티모듈 지원 |
| Build Tool | **Gradle (Kotlin DSL)** | 멀티모듈 관리, Version Catalog |
| DB | **MySQL 8.x** | 가게-상품 데이터 저장. 국내 커머스 실무 표준 |
| ORM | **Spring Data JPA** | 타입 안전 쿼리, 동적 검색 조건 |
| Search Engine | **Elasticsearch 8.x + Nori** | 한국어 검색. Docker 이미지에 Nori 플러그인 포함 |
| ES Client | **Elasticsearch Java Client 8.x** | 공식 클라이언트, type-safe API |
| LLM | **Spring AI** | OpenAI/Claude 추상화, Provider 교체 용이 |
| API Docs | **SpringDoc OpenAPI (Swagger)** | REST API 자동 문서화 |
| Container | **Docker Compose** | MySQL + ES + App 원클릭 실행 |

---

## 7. Multi-Module Structure (Hexagonal Architecture)

### 7.1 Module Dependency Rules

```
search-tuner-core                ← 순수 Kotlin. Spring 의존성 ZERO.
    ▲           ▲          ▲
    │           │          │
search-tuner  search-tuner  search-tuner
-infra-es     -infra-llm    -infra-persistence
    ▲           ▲          ▲
    └───────────┼──────────┘
                │
        search-tuner-api          ← 유일하게 모든 모듈 조립. @SpringBootApplication
```

| Module | Depends On | Spring Dependency | Role |
|--------|-----------|------------------|------|
| `search-tuner-core` | **없음** (순수 Kotlin) | **없음** | Domain Entity, Use Case 정의, Port Interface |
| `search-tuner-infra-es` | core | ES Java Client | ElasticsearchPort 구현 |
| `search-tuner-infra-llm` | core | Spring AI | LlmPort 구현 |
| `search-tuner-infra-persistence` | core | Spring Data JPA | DB Port 구현 |
| `search-tuner-api` | core + 모든 infra | Spring Web | REST Controller, DI 조립 |

### 7.2 Hexagonal Architecture Diagram

```
                        [search-tuner-api]
                     REST Controller (Input Adapter)
                     ProductController, SynonymController, ...
                                │
                                │ calls
                                ▼
                    ┌──────────────────────┐
                    │     Input Ports       │
                    │  (Use Case Interface) │
                    │                      │
                    │ SearchProductUseCase  │
                    │ GenerateSynonymUseCase│
                    │ RecommendAnalyzerUC   │
                    │ EvaluateSearchQuality │
                    └──────────────────────┘
                                │
                                │ implements
                                ▼
                    ┌──────────────────────┐
                    │  [search-tuner-core]  │
                    │                      │
                    │  Service (Use Case)   │
                    │  Domain Entity        │
                    │  Domain Service       │
                    │  Value Objects        │
                    └──────────────────────┘
                                │
                                │ depends on (Output Port Interface)
                                ▼
                    ┌──────────────────────┐
                    │    Output Ports       │
                    │ (Repository Interface)│
                    │                      │
                    │ ElasticsearchPort     │
                    │ LlmPort              │
                    │ ProductPersistence    │
                    │ EvaluationResultPort  │
                    └──────────────────────┘
                       │        │        │
                       ▼        ▼        ▼
               [infra-es] [infra-llm] [infra-persistence]
               ES Client  Spring AI    JPA Repository
```

---

## 8. Port & Adapter Detail

### 8.1 Input Ports (Use Case Interfaces)

```kotlin
interface SearchProductUseCase {
    fun search(command: SearchProductCommand): SearchProductResult
}

data class SearchProductCommand(
    val query: String,
    val category: String? = null,
    val page: Int = 0,
    val size: Int = 20
)

interface GenerateSynonymUseCase {
    fun generate(command: GenerateSynonymCommand): SynonymGenerationResult
}

data class GenerateSynonymCommand(
    val indexName: String,
    val fieldName: String,
    val sampleSize: Int = 1000,
    val category: String? = null
)

interface EvaluateSearchQualityUseCase {
    fun evaluate(command: EvaluateCommand): EvaluationResult
    fun compare(configA: String, configB: String, querySetId: String): ComparisonReport
}
```

### 8.2 Output Ports (Driven Side Interfaces)

```kotlin
interface ElasticsearchPort {
    fun sampleFieldValues(index: String, field: String, size: Int): List<String>
    fun analyzeText(index: String, analyzer: String, text: String): TokenizationResult
    fun search(index: String, query: String, size: Int): List<SearchHit>
    fun createIndex(index: String, settingsJson: String)
    fun updateSynonyms(index: String, synonyms: List<String>)
    fun bulkIndex(index: String, documents: List<ProductDocument>)
}

interface LlmPort {
    fun suggestSynonyms(terms: List<String>, domain: String): List<SynonymSuggestion>
    fun recommendAnalyzer(
        tokenizationResults: List<TokenizationResult>,
        domain: String
    ): AnalyzerRecommendation
    fun judgeRelevance(query: String, document: String): RelevanceScore
}

interface ProductPersistencePort {
    fun findAll(page: Int, size: Int): List<Product>
    fun findByCategory(category: String): List<Product>
    fun findById(id: Long): Product?
    fun save(product: Product): Product
}

interface EvaluationResultPort {
    fun save(result: EvaluationResult): EvaluationResult
    fun findByConfigLabel(label: String): List<EvaluationResult>
}
```

---

## 9. REST API Design

### 9.1 상품/검색 API (Foundation)

| Method | Endpoint | Description |
|--------|---------|------------|
| GET | `/api/v1/products` | 상품 목록 조회 (pagination) |
| GET | `/api/v1/products/{id}` | 상품 상세 조회 |
| POST | `/api/v1/products` | 상품 등록 |
| GET | `/api/v1/products/search?q={query}` | ES 기반 한국어 상품 검색 |
| POST | `/api/v1/index/full` | MySQL → ES 전체 색인 |
| POST | `/api/v1/index/sync` | 변경분 증분 색인 |

### 9.2 AI 튜닝 API

| Method | Endpoint | Description |
|--------|---------|------------|
| POST | `/api/v1/synonyms/generate` | ES 인덱스 분析 후 동의어 사전 자동 생성 |
| GET | `/api/v1/synonyms/{id}` | 생성된 동의어 사전 조회 |
| GET | `/api/v1/synonyms/{id}/download` | synonym.txt 파일 다운로드 |
| POST | `/api/v1/synonyms/{id}/apply` | 생성된 동의어를 ES 인덱스에 즉시 적용 |
| POST | `/api/v1/analyzer/recommend` | 데이터 분析 후 최적 分析器 설정 추천 |
| POST | `/api/v1/analyzer/compare` | 복수 分析器 설정 토큰화 결과 비교 |
| POST | `/api/v1/evaluation/run` | 쿼리 세트 기반 검색 품질 평가 실행 |
| GET | `/api/v1/evaluation/{id}/report` | 평가 결과 리포트 조회 |
| POST | `/api/v1/evaluation/compare` | 두 설정 간 A/B 품질 비교 |

### 9.3 API Request/Response Example

**동의어 자동 생성 요청:**

```json
POST /api/v1/synonyms/generate
{
  "indexName": "products",
  "fieldName": "product_name",
  "sampleSize": 2000,
  "category": "fashion"
}
```

**응답:**

```json
{
  "id": "syn_20260306_001",
  "generatedAt": "2026-03-06T12:00:00",
  "totalGroups": 45,
  "synonymGroups": [
    {
      "category": "fashion",
      "terms": ["캐나다구스", "캐구", "Canada Goose"],
      "type": "EQUIVALENT",
      "confidence": 0.95
    },
    {
      "category": "fashion",
      "terms": ["패딩", "다운자켓", "다운점퍼", "패딩점퍼"],
      "type": "EQUIVALENT",
      "confidence": 0.88
    },
    {
      "category": "fashion",
      "terms": ["나이키", "Nike", "NIKE"],
      "type": "EQUIVALENT",
      "confidence": 0.99
    }
  ],
  "downloadUrl": "/api/v1/synonyms/syn_20260306_001/download"
}
```

---

## 10. Data Flow

### 10.1 동의어 자동 생성 흐름

```
1. Client → POST /api/v1/synonyms/generate (indexName, fieldName, sampleSize)
       │
2. SynonymController (Input Adapter)
       │ calls
3. GenerateSynonymUseCase.generate()
       │
4. SynonymGenerationService (Use Case Impl)
       │
       ├─→ ElasticsearchPort.sampleFieldValues()
       │      → ElasticsearchAdapter가 ES에서 상품명 2,000개 샘플링
       │
       ├─→ Domain Service: 용어 빈도 분류, co-occurrence 추출
       │      → ["캐나다구스", "캐구", "Canada Goose"] 클러스터 형성
       │
       ├─→ LlmPort.suggestSynonyms()
       │      → LlmAdapter가 LLM에 "이 용어들이 동의어인지 판단해줘" 요청
       │      → LLM 응답을 SynonymGroup 도메인 객체로 변환
       │
       ├─→ EvaluationResultPort.save()
       │      → DB에 생성 이력 저장
       │
5. Controller → SynonymGenerationResult를 JSON 응답
       │
6. (선택) POST /api/v1/synonyms/{id}/apply
       │
7. ElasticsearchPort.updateSynonyms()
       → ES 인덱스에 동의어 사전 적용
```

### 10.2 검색 품질 A/B 비교 흐름

```
1. 설정 A로 색인된 인덱스에서 쿼리 세트 100개 검색 실행
2. 각 검색 결과 top-10에 대해 LLM이 relevance 채점 (0~3)
3. nDCG@10 산출 → 예: 0.72

4. 동의어 사전을 적용한 설정 B로 인덱스 재구성
5. 같은 쿼리 세트 100개 검색 실행
6. 같은 방식으로 nDCG@10 산출 → 예: 0.85

7. 비교 리포트 생성:
   - Overall: 설정 B가 18% 향상
   - 개선된 쿼리: "캐구 패딩" (0.3 → 0.9), "블루투쓰 이어폰" (0.5 → 0.8)
   - 악화된 쿼리: "배 과일" (0.8 → 0.6, 동의어 충돌)
```

---

## 11. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | 동의어 생성: 10,000 상품 기준 5분 이내. 품질 평가: 100 쿼리 기준 10분 이내. |
| Extensibility | LLM Provider 교체 가능 (OpenAI, Claude, Gemini). 새로운 평가 메트릭 추가 용이. |
| Usability | REST API + Swagger UI. Docker Compose 한 번으로 전체 환경 구동. |
| Compatibility | Elasticsearch 7.x, 8.x 호환. |
| Observability | 구조화 로깅 (structured logging), LLM 호출 비용/시간 추적. |
| License | Apache 2.0 |
