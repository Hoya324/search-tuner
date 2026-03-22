# 01. 초기 세팅 및 데이터 준비

## 전제 조건

```bash
# Docker 기동 확인
docker compose ps
# → search-tuner-mysql, search-tuner-es, search-tuner-kibana 모두 healthy 상태여야 함

# 앱 실행
./gradlew :search-tuner-api:bootRun
# → Started SearchTunerApplication 로그 확인
```

---

## 실험 1-1. 첫 전체 색인 실행

### 절차

```bash
# 1. 인덱스 생성 + 전체 색인 시작
curl -X POST "http://localhost:8080/api/v1/index/full?indexName=products"

# 2. 응답으로 받은 jobId로 진행 상황 확인
curl "http://localhost:8080/api/v1/index/jobs/{jobId}"

# 3. status가 COMPLETED 될 때까지 반복 조회
# { "status": "COMPLETED", "indexed": 10000, "total": 10000 }
```

### 확인 사항
- `indexed / total` 이 10,000/10,000이 되는지
- ES에 인덱스가 생성됐는지 직접 확인:
  ```bash
  curl "http://localhost:9200/products/_count"
  # → { "count": 10000 }
  ```

---

## 실험 1-2. 기본 검색 동작 확인

```bash
# 단순 검색
curl "http://localhost:8080/api/v1/products/search?q=패딩"
curl "http://localhost:8080/api/v1/products/search?q=나이키"
curl "http://localhost:8080/api/v1/products/search?q=운동화"

# 결과 확인:
# - hits가 반환되는가?
# - 스코어가 있는가?
# - 관련 상품이 상위에 오는가? (육안 판단)
```

### 학습 포인트
- 색인 없이 검색하면 `index_not_found_exception` 발생 → 색인이 선행 조건임을 체감
- 첫 검색 결과 품질이 어느 정도인지 기준선(baseline) 기록

---

## 실험 1-3. ES 인덱스 구조 직접 확인

```bash
# 매핑 확인 (필드 타입, 분석기 설정)
curl "http://localhost:9200/products/_mapping?pretty"

# 설정 확인 (분석기 체인)
curl "http://localhost:9200/products/_settings?pretty"

# 샘플 문서 확인
curl "http://localhost:9200/products/_search?size=3&pretty"
```

### 확인 항목
- `product_name` 필드에 `index_analyzer: nori_index`, `search_analyzer: nori_search` 가 적용됐는가?
- `nori_search` 분석기에 `synonym_graph` 필터가 포함됐는가?
- `synonym_graph` 필터의 `updateable: true` 설정이 있는가? (핫 리로드 조건)

---

## 실험 1-4. Swagger UI에서 전체 API 탐색

브라우저에서 `http://localhost:8080/swagger-ui.html` 접속 후:
- 모든 엔드포인트 목록 확인
- `/api/v1/products/search` Try it out → 여러 쿼리 테스트
- 각 API의 요청/응답 스키마 파악

---

## 체크리스트

- [ ] Docker 컨테이너 3개(MySQL, ES, Kibana) 모두 healthy
- [ ] 앱 정상 기동 (포트 8080)
- [ ] 전체 색인 완료 (10,000건)
- [ ] 기본 검색 응답 확인
- [ ] Swagger UI 접속 성공
