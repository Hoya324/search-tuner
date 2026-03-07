# Search Tuner

AI 기반 한국어 커머스 Elasticsearch 검색 품질 튜닝 도구.

프론트엔드: [https://v0-kst.vercel.app/search](https://v0-kst.vercel.app/search)

---

## 실행 방법

### 방법 A. 로컬 직접 실행 (권장 - 개발용)

#### 사전 조건
- Java 21+
- Docker Desktop

#### 1단계 — 저장소 클론

```bash
git clone <repo-url>
cd search-tuner
```

#### 2단계 — 환경변수 설정

```bash
# 프로젝트 루트에 .env 파일 생성
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

Gemini API 키 발급: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

#### 3단계 — 인프라 기동

```bash
docker compose up -d
```

MySQL과 Elasticsearch(Nori 플러그인 포함)가 기동됩니다.
처음 실행 시 ES 이미지 빌드로 2~3분 소요됩니다.

```bash
# 정상 기동 확인 (두 컨테이너 모두 healthy 상태여야 함)
docker compose ps
```

#### 4단계 — 앱 실행

```bash
./gradlew :search-tuner-api:bootRun
```

앱이 시작되면 `http://localhost:8080` 에서 백엔드가 동작합니다.

#### 5단계 — 데이터 색인

swagger `http://localhost:8080/swagger-ui.html` 에서도 확인 가능

```bash
# 10,000개 샘플 상품 전체 색인 (최초 1회 필요)
curl -X POST "http://localhost:8080/api/v1/index/full?indexName=products"

# 색인 완료 확인 (status: COMPLETED 될 때까지 대기)
curl "http://localhost:8080/api/v1/index/jobs/{위에서받은jobId}"
```

#### 6단계 — 프론트엔드 접속

브라우저에서 [https://v0-kst.vercel.app/search](https://v0-kst.vercel.app/search) 접속
---

### 방법 B. Docker Hub 이미지로 실행 (코드 없이 바로 사용)

Docker Hub 이미지: [`hoya324/kst:latest`](https://hub.docker.com/r/hoya324/kst)

#### 사전 조건
- Docker Desktop만 있으면 됨 (Java, 코드 불필요)

#### 1단계 — 이 저장소의 docker 관련 파일만 받기

```bash
git clone <repo-url>
cd search-tuner
```

또는 `docker-compose.yml`과 `docker/` 폴더만 복사해도 됩니다.

#### 2단계 — 환경변수 설정

```bash
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

#### 3단계 — docker-compose.override.yml 작성

```bash
cat > docker-compose.override.yml << 'EOF'
services:
  app:
    image: hoya324/kst:latest
    build: ~
    profiles: []
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/search_tuner?useSSL=false&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: tuner
      SPRING_DATASOURCE_PASSWORD: tuner123
      ES_HOST: elasticsearch
      ES_PORT: "9200"
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
EOF
```

#### 4단계 — 전체 기동

```bash
docker compose up -d
```

MySQL + Elasticsearch + App 세 컨테이너가 모두 기동됩니다.

```bash
# 상태 확인
docker compose ps
curl http://localhost:8080/api/v1/status
```

#### 5단계 — 데이터 색인

```bash
curl -X POST "http://localhost:8080/api/v1/index/full?indexName=products"
```

#### 이미지 최신화 방법

```bash
docker pull hoya324/kst:latest
docker compose up -d --force-recreate app
```

---

## 시스템 상태 확인

```bash
# 전체 상태 (ES 연결, MySQL 연결, 문서 수)
curl http://localhost:8080/api/v1/status

# 인덱스 상세 상태
curl http://localhost:8080/api/v1/index/status

# Swagger UI (전체 API 문서)
open http://localhost:8080/swagger-ui.html
```

---

## 주요 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/status` | 시스템 헬스체크 |
| `GET` | `/api/v1/index/status` | 인덱스·데이터 현황 |
| `POST` | `/api/v1/index/full` | 전체 색인 시작 |
| `GET` | `/api/v1/products/search?q=검색어` | 상품 검색 |
| `POST` | `/api/v1/synonyms/generate` | LLM 동의어 생성 |
| `POST` | `/api/v1/synonyms/{id}/apply` | 동의어 적용 |
| `DELETE` | `/api/v1/synonyms/{id}` | 동의어 삭제 |
| `POST` | `/api/v1/evaluation/run` | 검색 품질 평가 |
| `GET` | `/api/v1/evaluation/metrics` | 평가 메트릭 차트 데이터 |

전체 API: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 포트 정보

| 서비스 | 호스트 포트 |
|--------|------------|
| Spring Boot API | 8080 |
| MySQL | 3307 |
| Elasticsearch | 9200 |

---

## 프로젝트 구조

```
search-tuner/
├── search-tuner-core/          # 순수 Kotlin 도메인 (Spring 무의존)
├── search-tuner-infra-es/      # Elasticsearch 어댑터
├── search-tuner-infra-llm/     # Spring AI (Gemini) 어댑터
├── search-tuner-infra-persistence/ # JPA 어댑터
├── search-tuner-api/           # Spring Boot 진입점, REST 컨트롤러
├── docker/                     # MySQL 스키마, ES Dockerfile
├── docs/
│   ├── architecture.md         # 전체 아키텍처 문서 (Mermaid 다이어그램)
│   └── study/                  # 실험 연구 가이드
└── docker-compose.yml
```

## 문서

- [아키텍처 설계](docs/architecture.md)
- [실험 연구 로드맵](docs/study/README.md)
