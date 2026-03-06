# 03. 동의어 실험 — 생성·적용·효과 측정

## 배경: 동의어가 왜 필요한가

한국 커머스 검색의 핵심 문제:
- `나이키` ≠ `Nike` → 같은 브랜드인데 다른 토큰
- `롱패딩` ≠ `긴패딩` → 같은 상품인데 다른 표현
- `맥북` ≠ `MacBook` → 줄임말 vs 정식 명칭
- `에어팟` → `에어팟`, `AirPods`, `에어팟프로` 를 하나로 묶어야 함

---

## 실험 3-1. 동의어 없을 때 기준선 측정

```bash
# 동의어 적용 전 검색 결과 수 기록
curl "http://localhost:8080/api/v1/products/search?q=나이키&size=20" | jq '.total'
curl "http://localhost:8080/api/v1/products/search?q=nike&size=20" | jq '.total'
curl "http://localhost:8080/api/v1/products/search?q=롱패딩&size=20" | jq '.total'
curl "http://localhost:8080/api/v1/products/search?q=긴패딩&size=20" | jq '.total'
```

**기준선 기록표 (실험 전 채우기)**

| 쿼리 | 결과 수 (before) | 결과 수 (after) | 개선율 |
|------|-----------------|-----------------|--------|
| 나이키 | | | |
| nike | | | |
| 롱패딩 | | | |
| 긴패딩 | | | |
| 맥북 | | | |
| MacBook | | | |

---

## 실험 3-2. LLM 동의어 생성

```bash
# brand 필드 기반 동의어 생성
curl -X POST "http://localhost:8080/api/v1/synonyms/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "indexName": "products",
    "fields": ["brand", "product_name"],
    "sampleSize": 200,
    "minConfidence": 0.7
  }'

# 응답 예시:
# {
#   "id": "syn-001",
#   "groups": [
#     { "terms": ["나이키", "Nike", "NIKE"], "type": "EQUIVALENT", "confidence": 0.95 },
#     { "terms": ["롱패딩", "긴패딩", "롱다운"], "type": "EQUIVALENT", "confidence": 0.88 }
#   ]
# }
```

### 관찰 포인트
- LLM이 자동으로 어떤 동의어 그룹을 만들었는가?
- confidence가 낮은 그룹은 어떤 특징이 있는가?
- 틀린 동의어가 있는가? (예: 전혀 다른 브랜드를 같은 그룹으로 묶음)
- 중요한 동의어를 놓쳤는가?

### 수동 검토 포인트
```bash
# 생성된 동의어 목록 조회
curl "http://localhost:8080/api/v1/synonyms/{id}"

# 잘못된 그룹은 수정
curl -X PATCH "http://localhost:8080/api/v1/synonyms/{id}/groups/{groupId}" \
  -H "Content-Type: application/json" \
  -d '{"terms": ["나이키", "Nike"], "type": "EQUIVALENT"}'
```

---

## 실험 3-3. 동의어 적용 방식 비교

### 방법 A: 핫 리로드 (다운타임 없음, 매핑 변경 불필요)

```bash
curl -X POST "http://localhost:8080/api/v1/synonyms/{id}/apply" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "RELOAD", "indexName": "products"}'
```

**원리**:
1. `product_synonyms.txt` 파일 업데이트
2. ES `_reload_search_analyzers` API 호출
3. 재색인 없이 search_analyzer만 갱신
4. 적용 시간: ~1초

**제약**:
- `index_analyzer`는 변경 안 됨 → 색인 시점 토큰은 그대로
- `search_analyzer`만 변경 → 검색 쿼리 토큰이 변경됨
- `updateable: true`로 설정된 필터만 가능

### 방법 B: Blue-Green 마이그레이션 (완전 반영, 다운타임 없음)

```bash
curl -X POST "http://localhost:8080/api/v1/index/migrate?alias=products"
```

**원리**:
1. `products-{timestamp}` 새 인덱스 생성 (새 동의어 설정 포함)
2. 전체 데이터 재색인
3. `products` alias를 새 인덱스로 원자적 전환
4. 구 인덱스 삭제

**언제 필요한가**: 분석기 설정 변경, 매핑 변경, index_analyzer 변경 시

### 실험: 두 방법의 결과 차이 확인

```bash
# RELOAD 적용 후
curl "http://localhost:8080/api/v1/products/search?q=nike" | jq '.total'
# → 동의어(나이키=nike)가 search_analyzer에서 처리되므로 결과 나옴

# 단, 색인된 토큰은 "나이키" 그대로 → 반대 방향도 테스트
curl "http://localhost:8080/api/v1/products/search?q=나이키" | jq '.total'
```

---

## 실험 3-4. 동의어 방향성 실험 (EQUIVALENT vs ONEWAY)

### EQUIVALENT (양방향)
```
나이키, Nike, NIKE
→ "나이키" 검색 시 Nike 문서도, "Nike" 검색 시 나이키 문서도 히트
```

### ONEWAY (단방향)
```
나이끼 => 나이키
→ "나이끼"(오타) 검색 시 "나이키" 로 변환됨
→ "나이키" 검색 시 "나이끼" 문서는 히트 안 됨 (맞는 동작)
```

### 실험
```bash
# ONEWAY 동의어 직접 테스트
# 1. 수동으로 synonyms.txt에 추가
echo "나이끼 => 나이키" >> ./docker/elasticsearch/config/synonyms/product_synonyms.txt

# 2. 핫 리로드
curl -X POST "http://localhost:9200/products/_reload_search_analyzers"

# 3. 오타 검색 테스트
curl "http://localhost:8080/api/v1/products/search?q=나이끼"
```

---

## 실험 3-5. 동의어 파일 다운로드 & 검토

```bash
# 현재 적용된 동의어 파일 내용 확인
curl "http://localhost:8080/api/v1/synonyms/{id}/download"

# 파일 형식 확인
cat ./docker/elasticsearch/config/synonyms/product_synonyms.txt
```

### 학습: ES 동의어 파일 형식
```
# EQUIVALENT (Lucene Solr 형식)
나이키, Nike, NIKE

# ONEWAY (WordNet 형식)
나이끼 => 나이키
맥북 => MacBook, 맥북프로
```

---

## 핵심 개념 정리

| 개념 | 내 이해 |
|------|--------|
| search-time synonym이 index-time보다 나은 이유 | |
| updateable: true의 역할 | |
| RELOAD vs 재색인 언제 각각 사용? | |
| 동의어가 recall에 미치는 영향 | |
| 동의어가 precision에 미치는 위험 | |
