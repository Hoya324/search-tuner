# Korean Search Tuner

> AI 기반 한국어 이커머스 Elasticsearch 검색 품질 튜닝 도구

[![Build](https://github.com/hoya324/search-tuner/actions/workflows/deploy.yml/badge.svg)](https://github.com/hoya324/search-tuner/actions/workflows/deploy.yml)

**한국 이커머스 검색의 두 가지 핵심 문제를 해결합니다.**

**문제 1 — 측정 불가능한 품질 개선**
"AI 동의어를 도입했더니 검색이 좋아졌습니다"는 측정할 수 없습니다. Search Tuner는 nDCG, P@K, MRR 등 표준 IR 메트릭으로 검색 품질을 정량 측정하고, 통계 유의성(p-value)까지 검증합니다.

**문제 2 — 동의어 변경 시 서비스 중단**
일반적인 ES 동의어 변경은 인덱스를 닫았다 열어야 합니다. Search Tuner는 두 가지 무중단 전략을 제공합니다.

| 전략 | 방식 | 적합한 경우 |
|------|------|-------------|
| Reload | `updateable: true` + `_reload_search_analyzers` | 동의어 사전만 변경 |
| Blue-Green | 신규 인덱스 빌드 → Alias 원자적 전환 | 분석기·매핑 변경 |

---

## 라이브 데모

| 서비스 | URL |
|--------|-----|
| **프론트엔드** | [https://v0-kst.vercel.app/search](https://v0-kst.vercel.app/search) |
| **백엔드 API** | [https://search.git-tree.com](https://search.git-tree.com) |
| **Swagger UI** | [https://search.git-tree.com/swagger-ui.html](https://search.git-tree.com/swagger-ui.html) |

---

## 주요 기능

- **상품 색인** — 10,000개 샘플 상품 자동 생성 및 Elasticsearch 색인
- **한국어 검색** — Nori 형태소 분석기 기반 자연어 검색
- **AI 동의어 생성** — Gemini LLM이 검색어 동의어 자동 생성
- **무중단 동의어 적용** — Reload / Blue-Green 두 가지 전략
- **검색 품질 평가** — Golden Query Set 기반 nDCG@10, P@5, MRR 자동 측정
- **A/B 비교 & 통계 검증** — 두 인덱스 설정 비교, p-value 검증

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Backend** | Kotlin, Spring Boot 3.4, Hexagonal Architecture |
| **Search** | Elasticsearch 8.17, Nori 형태소 분석기 |
| **AI** | Spring AI 1.0, Google Gemini (OpenAI 호환 엔드포인트) |
| **DB** | MySQL 8 + Spring Data JPA |
| **Infra** | Docker, AWS EC2, AWS ECR Public, GitHub Actions |

---

## API 문서 (Swagger)

전체 API는 Swagger UI에서 확인하고 직접 실행할 수 있습니다.

**라이브:** [https://search.git-tree.com/swagger-ui.html](https://search.git-tree.com/swagger-ui.html)
**로컬:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/status` | 시스템 헬스체크 (ES·DB 연결 상태) |
| `GET` | `/api/v1/index/status` | 인덱스·문서 수 현황 |
| `POST` | `/api/v1/index/full` | 전체 상품 색인 시작 |
| `GET` | `/api/v1/index/jobs/{jobId}` | 색인 작업 진행 상황 |
| `GET` | `/api/v1/products/search?q=검색어` | 상품 검색 |
| `POST` | `/api/v1/synonyms/generate` | LLM 동의어 생성 |
| `POST` | `/api/v1/synonyms/{id}/apply` | 동의어 무중단 적용 |
| `DELETE` | `/api/v1/synonyms/{id}` | 동의어 삭제 |
| `POST` | `/api/v1/evaluation/run` | 검색 품질 평가 실행 |
| `GET` | `/api/v1/evaluation/metrics` | 평가 메트릭 차트 데이터 |

---

## 프로젝트 구조

헥사고날 아키텍처(Ports & Adapters) 기반 Spring Boot 멀티모듈입니다.

```
search-tuner/
├── search-tuner-core/              # 순수 Kotlin 도메인 (Spring·DB·ES 무의존)
│   └── service/metric/             # IR 메트릭 계산 (nDCG, P@K, MRR)
├── search-tuner-infra-es/          # Elasticsearch Java Client 어댑터
├── search-tuner-infra-llm/         # Spring AI (Gemini) 어댑터
├── search-tuner-infra-persistence/ # JPA 어댑터
├── search-tuner-api/               # Spring Boot 진입점, REST 컨트롤러
│   └── resources/evaluation/       # Golden Query Set (YAML)
├── docker/                         # MySQL 스키마, ES Dockerfile (Nori 포함)
└── docs/                           # 아키텍처, 실험 연구 가이드
```

Core는 외부 의존성이 전혀 없어 단독 단위 테스트가 가능합니다.

---

## 로컬 실행

### 방법 A. 직접 빌드 (개발용)

**사전 조건:** Java 21+, Docker Desktop

```bash
# 1. 클론
git clone <repo-url>
cd search-tuner

# 2. 환경변수 (Gemini API 키만 필요)
echo "GEMINI_API_KEY=your_api_key" > .env
# 키 발급: https://aistudio.google.com/app/apikey

# 3. 인프라 기동 (MySQL + Elasticsearch)
docker compose up -d

# 기동 확인 (healthy 상태 대기)
docker compose ps

# 4. 앱 실행
./gradlew :search-tuner-api:bootRun
```

앱 기동 후 `http://localhost:8080/swagger-ui.html` 접속

```bash
# 5. 샘플 데이터 색인 (최초 1회)
curl -X POST "http://localhost:8080/api/v1/index/full?indexName=products"

# 색인 완료 확인
curl "http://localhost:8080/api/v1/index/jobs/{jobId}"
```

> **주의:** 로컬 docker-compose.yml은 Elasticsearch의 `xpack.security.enabled=false`로 설정되어 있습니다. 개발 환경 전용이며 외부에 노출하지 마세요.

---

### 방법 B. ECR 이미지로 실행 (빌드 없이)

**사전 조건:** Docker Desktop만 있으면 됨

```bash
# 1. 클론
git clone <repo-url>
cd search-tuner

# 2. 환경변수 설정
cat > .env << 'EOF'
GEMINI_API_KEY=your_api_key
MYSQL_ROOT_PASSWORD=strong_root_password
MYSQL_USER=tuner
MYSQL_PASSWORD=strong_password
EOF

# 3. 기동 (MySQL + Elasticsearch + App)
docker compose -f docker-compose.hub.yml up -d

# 상태 확인
curl http://localhost:8080/api/v1/status

# 4. 샘플 데이터 색인
curl -X POST "http://localhost:8080/api/v1/index/full?indexName=products"
```

이미지: [`public.ecr.aws/j8w6n7e6/kst:latest`](https://gallery.ecr.aws/j8w6n7e6/kst)

> **주의:** `docker-compose.hub.yml`은 `JPA_DDL_AUTO: update`와 MySQL 포트(3307)가 호스트에 노출됩니다. 로컬 개발 전용입니다.

---

## 포트

| 서비스 | 포트 |
|--------|------|
| Spring Boot API | 8080 |
| MySQL (로컬) | 3307 |
| Elasticsearch (로컬) | 9200 |

---

## 문서

- [아키텍처 상세](docs/architecture.md) — 헥사고날 구조, 기능 플로우, IR 메트릭 원리
- [실험 연구 로드맵](docs/study/README.md) — 동의어·분석기·LLM 실험 가이드