# Korean Search Tuner (KST)

> LLM을 활용해 Elasticsearch 동의어 사전을 자동 생성하고, IR 지표로 검색 품질을 정량 측정하는 도구

[![Build](https://github.com/hoya324/search-tuner/actions/workflows/deploy.yml/badge.svg)](https://github.com/hoya324/search-tuner/actions/workflows/deploy.yml)

---

## 빠른 시작

```bash
git clone https://github.com/hoya324/search-tuner
cd search-tuner

# 1. 환경 변수 설정
cp .env.example .env
# .env 에서 LLM API Key 설정 (아래 LLM 제공자 섹션 참고)

# 2. 전체 스택 실행 (프론트엔드 + 백엔드 + MySQL + Elasticsearch)
docker compose -f docker-compose.local.yml up --build -d

# 3. 접속 확인
open http://localhost:3000          # 관리 UI
open http://localhost:8080/swagger-ui.html  # REST API 문서
```

---

## LLM 제공자

`.env`에서 원하는 제공자의 키와 모델을 설정합니다. **여러 키가 설정된 경우 우선순위가 높은 것이 사용**됩니다.

| 우선순위 | 제공자 | API Key 환경변수 | 모델 환경변수 | 기본 모델 |
|---------|--------|----------------|-------------|---------|
| 3 (최우선) | Anthropic Claude | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` | `claude-3-5-haiku-20241022` |
| 2 | Google Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` | `gemini-2.5-flash-lite` |
| 1 | OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` | `gpt-4o-mini` |

```bash
# .env 예시 (하나만 설정하면 됨)
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-pro        # 선택 사항, 기본값 사용 가능

# OPENAI_API_KEY=your_key_here
# OPENAI_MODEL=gpt-4o

# ANTHROPIC_API_KEY=your_key_here
# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

앱 시작 시 선택된 제공자가 로그에 출력됩니다:
```
LLM provider selected: Gemini
```

새 제공자 추가는 `search-tuner-infra-llm-{provider}` 모듈을 추가하고 `LlmProviderStrategy`를 구현하면 됩니다.

---

## 해결하고 싶은 문제

한국 이커머스 검색의 두 가지 핵심 문제를 해결합니다.

**문제 1 — "검색이 좋아졌다"를 측정할 수 없다**

동의어 사전을 적용하면 정말 나아지는가? 얼마나? 이 프로젝트는 IR 지표(nDCG, P@K, MRR)와 paired t-test로 개선을 수치화합니다.

```
동의어 적용 전후 비교 예시:
nDCG@10: 0.72 → 0.85  (+17.7%)
P@5:     0.68 → 0.81  (+19.1%)
MRR:     0.74 → 0.88  (+18.3%)
p-value: 0.003  → 통계적으로 유의한 개선
```

**문제 2 — 동의어 변경 시 다운타임이 발생한다**

일반적인 ES 동의어 변경은 인덱스를 close → 수정 → open 해야 합니다. 이 프로젝트는 두 가지 무중단 전략을 제공합니다.

| 전략 | 방식 | 소요 시간 | 적합한 경우 |
|------|------|----------|-----------|
| **Reload** | `updateable: true` + `_reload_search_analyzers` | ~1초 | 동의어 파일만 변경 |
| **Blue-Green** | 신규 인덱스 빌드 → Alias 원자적 전환 | 전체 재색인 | 분석기/매핑 변경 |

---

## 주요 기능

### 동의어 사전 자동 생성
- ES terms aggregation으로 상품명 상위 N개 추출
- 500개씩 배치로 LLM에 전송 → 동의어 그룹 생성
- 공통 term을 가진 그룹을 자동 병합 (Union-Find 방식)
- confidence 점수(0~1)로 낮은 품질 그룹 필터링

```bash
POST /api/v1/synonyms/generate
→ [{"terms": ["나이키", "Nike", "NIKE"], "type": "EQUIVALENT", "confidence": 0.95},
   {"terms": ["캐구", "캐나다구스"], "type": "EQUIVALENT", "confidence": 0.91}]
```

### 검색 품질 평가 (IR Metrics)
100개 Golden Query Set 기반 자동 평가 파이프라인:

- **nDCG@10**: 상위 10개 결과의 순위 품질 (0~1)
- **P@5**: 상위 5개 중 관련 문서 비율
- **MRR**: 첫 번째 관련 문서 순위의 역수 평균
- **Paired t-test**: A/B 차이의 통계적 유의성 검증 (p < 0.05)

```bash
POST /api/v1/evaluation/compare
→ {"ndcgDelta": "+17.7%", "pValue": 0.003, "isSignificant": true}
```

### Nori 분석기 추천
샘플 텍스트를 3가지 decompound 모드(`none` / `discard` / `mixed`)로 토크나이징한 결과를 LLM에게 보여주고 최적 설정을 추천받습니다.

```bash
POST /api/v1/analyzers/recommend
→ {"recommendation": "mixed", "reasoning": "복합명사 원형 보존으로 정밀도·재현율 모두 확보"}
```

---

## 아키텍처

### 헥사고날 아키텍처 (Ports & Adapters)

의존성은 항상 **바깥 → 안쪽**으로만 흐릅니다. `search-tuner-core`는 Spring, JPA, Elasticsearch를 전혀 모릅니다.

```
[REST Controller]  →  [Input Port]  →  [Application Service]  →  [Output Port]
  (infra-api)           (core)               (core)                  (core)
                                                                        ↑
                                             [ES Adapter] ─────────────┤
                                             [LLM Adapter] ────────────┤
                                             [JPA Adapter] ────────────┘
```

### 멀티모듈 구조

```
search-tuner
├── search-tuner-core                  # 순수 Kotlin 도메인 (Spring 의존성 없음)
│   ├── domain/                        # Product, SynonymSet, EvaluationResult ...
│   ├── port/in/                       # UseCase 인터페이스
│   ├── port/out/                      # LlmPort, ElasticsearchPort ...
│   └── service/metric/               # IrMetricCalculator (nDCG, P@K, MRR, t-test)
│
├── search-tuner-infra-llm             # LLM 공통 (인터페이스 + 어댑터 + 프롬프트)
│   └── provider/LlmProviderStrategy   # 전략 인터페이스 (buildChatClient())
│
├── search-tuner-infra-llm-gemini      # Gemini 전략 (priority=2, GEMINI_API_KEY)
├── search-tuner-infra-llm-openai      # OpenAI 전략 (priority=1, OPENAI_API_KEY)
├── search-tuner-infra-llm-claude      # Claude 전략 (priority=3, ANTHROPIC_API_KEY)
│
├── search-tuner-infra-es              # Elasticsearch Java Client 8.x 어댑터
├── search-tuner-infra-persistence     # Spring Data JPA + MySQL 어댑터
└── search-tuner-api                   # Spring Boot 진입점, REST 컨트롤러
```

**LLM 제공자 선택 흐름:**
```
앱 시작
  → Spring이 classpath에서 LlmProviderStrategy @Component 수집
  → LlmConfig: isAvailable()=true인 것 중 priority 최고값 선택
  → 선택된 전략의 buildChatClient() 호출 → ChatClient Bean 등록
```

### 주요 설계 결정

| 결정 | 이유 |
|------|------|
| `@Async` 대신 `Thread { }.start()` | Spring AOP는 같은 클래스 내부 호출 시 프록시를 거치지 않아 `@Async` 무효화 |
| search-time 동의어 (index-time 아님) | `updateable: true`로 재색인 없이 `_reload_search_analyzers`로 즉시 적용 가능 |
| LLM `reasoning` 필드 강제 | Chain-of-Thought 효과 → 판단 근거를 쓰게 해서 품질 향상 |
| confidence threshold 0.7 | 억지 동의어 차단, 틀린 동의어가 검색 정밀도를 떨어뜨리는 것 방지 |
| 동의어 그룹 병합 알고리즘 | LLM 배치별로 생성된 그룹이 공통 term을 공유할 수 있어 Union-Find 방식으로 병합 |
| 전략 패턴 + 모듈 분리 | 새 LLM 제공자 추가 = 새 모듈 하나만 추가, 기존 코드 무변경 |

---

## API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/v1/index/full` | 전체 상품 색인 (비동기, jobId 반환) |
| `GET`  | `/api/v1/index/jobs/{jobId}` | 색인 진행 상황 조회 |
| `GET`  | `/api/v1/products/search` | 상품 검색 |
| `POST` | `/api/v1/synonyms/generate` | LLM으로 동의어 생성 |
| `GET`  | `/api/v1/synonyms` | 동의어 세트 목록 |
| `POST` | `/api/v1/synonyms/{id}/apply` | ES에 동의어 적용 (RELOAD / BLUE_GREEN) |
| `GET`  | `/api/v1/synonyms/{id}/download` | 동의어 파일 다운로드 |
| `POST` | `/api/v1/analyzers/recommend` | Nori 분석기 설정 추천 |
| `POST` | `/api/v1/evaluation/run` | 검색 품질 평가 실행 |
| `GET`  | `/api/v1/evaluation/results` | 평가 결과 목록 |
| `POST` | `/api/v1/evaluation/compare` | A/B 비교 + 통계 검증 |

- Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## 로컬 개발 (IDE에서 앱 직접 실행)

```bash
# 인프라만 실행
docker compose -f docker-compose.local.yml up mysql elasticsearch -d

# 백엔드 실행 (Java 21 필요)
./gradlew :search-tuner-api:bootRun

# 프론트엔드 실행 (별도 터미널, Node 20 + pnpm 필요)
cd search-tuner-frontend
pnpm install
pnpm dev   # http://localhost:3000
```

`.env` 파일이 프로젝트 루트에 있으면 앱 시작 시 자동 로드됩니다.

```bash
./gradlew build -x test          # 전체 빌드
./gradlew :search-tuner-core:test  # IR 지표 계산 단위 테스트
```

---

## 기술 스택

| 항목 | 버전 |
|------|------|
| Kotlin | 2.1.20 |
| Spring Boot | 3.4.3 |
| Spring AI | 1.0.0 GA |
| Elasticsearch | 8.17 + Nori 형태소 분석기 |
| MySQL | 8.0 |
| Java | 21 |

---

## 문서

| 문서 | 설명 |
|------|------|
| [Architecture](docs/architecture.md) | 헥사고날 아키텍처, 멀티모듈 구조, 주요 기술 결정 |
| [PRD](docs/prd.md) | 프로젝트 요구사항, 시스템 설계, DB/ES 스키마, API 설계 |
| [Technical Solutions](docs/technical-solutions.md) | 검색 품질 평가 파이프라인(3-Layer), 무중단 동의어 업데이트 전략 |
| [Problem Solve](docs/problem-solve.md) | LLM 동의어 품질 문제, 프롬프트 설계, 비용 추정, 위험 요소 |

### 학습 노트 (`docs/study/`)

| 문서 | 설명 |
|------|------|
| [01 - Setup](docs/study/01-setup.md) | ES + Nori 환경 구성, Docker 설정 |
| [02 - Search Basics](docs/study/02-search-basics.md) | ES 기본 검색, BM25, 쿼리 DSL |
| [03 - Synonym Experiments](docs/study/03-synonym-experiments.md) | 동의어 사전 실험 기록 |
| [04 - Analyzer Experiments](docs/study/04-analyzer-experiments.md) | Nori 분析器 설정 실험 기록 |
| [05 - Evaluation Experiments](docs/study/05-evaluation-experiments.md) | IR 지표(nDCG, P@K, MRR) 실험 기록 |
| [06 - LLM Prompt Tuning](docs/study/06-llm-prompt-tuning.md) | LLM 프롬프트 튜닝 실험 기록 |

