# 02. 검색 기초 — 스코어링과 한국어 토크나이징 이해

## 실험 2-1. 한국어 토큰 분석 직접 확인

### Nori가 한국어를 어떻게 쪼개는가

```bash
# ES _analyze API로 직접 확인
curl -X POST "http://localhost:9200/products/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "analyzer": "nori_index",
    "text": "나이키 에어맥스 운동화"
  }'

# 또는 앱 API 사용
curl -X POST "http://localhost:8080/api/v1/products/search/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "indexName": "products",
    "field": "product_name",
    "text": "나이키 에어맥스 운동화"
  }'
```

### 실험할 텍스트 목록

| 텍스트 | 관찰 포인트 |
|--------|------------|
| `나이키` | 브랜드명 - 단일 토큰인가? |
| `에어맥스` | 복합 외래어 - 어떻게 분해되는가? |
| `롱패딩` | 복합명사 - `롱`+`패딩`으로 쪼개지는가? |
| `무릎길이패딩` | 긴 복합명사 |
| `나이키운동화` | 띄어쓰기 없는 경우 |
| `Nike 에어맥스` | 한영 혼합 |

### 학습 포인트
- `decompound_mode: mixed` → 복합명사를 원형 + 분해 토큰 동시 색인
- `decompound_mode: discard` → 분해 토큰만 (원형 없음) → 검색 누락 가능
- 어떤 설정이 검색 재현율에 유리한가?

---

## 실험 2-2. 검색 스코어 이해

### BM25 스코어에 영향을 주는 요소

```bash
# explain=true로 스코어 계산 과정 확인
curl -X POST "http://localhost:9200/products/_search?explain=true&pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "multi_match": {
        "query": "나이키",
        "fields": ["product_name^3", "brand^2", "description"]
      }
    },
    "size": 3
  }'
```

### 관찰 포인트
- `product_name^3` → 3배 boost. 스코어에 실제로 얼마나 차이나는가?
- TF(단어 빈도), IDF(역문서빈도) 값이 어떻게 계산되는가?
- `brand` 필드에 정확히 `나이키`가 있는 문서 vs `product_name`에 포함된 문서 중 어느 쪽 스코어가 높은가?

### 실험 변형: boost 값 조정 효과

```bash
# brand를 더 강하게 부스팅해보기
"fields": ["product_name^2", "brand^5", "description^0.5"]
```
→ 브랜드 검색 시 결과 순위가 어떻게 바뀌는가?

---

## 실험 2-3. 오타/변형 검색 한계 확인

```bash
# 정확히 입력했을 때
curl "http://localhost:8080/api/v1/products/search?q=나이키"

# 오타 입력
curl "http://localhost:8080/api/v1/products/search?q=나이끼"   # 받침 오타
curl "http://localhost:8080/api/v1/products/search?q=nike"    # 영문 브랜드명
curl "http://localhost:8080/api/v1/products/search?q=나이키운동화"  # 붙여쓰기
```

### 예상 결과
- `나이끼` → hits 0개 (동의어 없으면 완전 실패)
- `nike` → hits 0개 (동의어 없으면 완전 실패)
- 이것이 동의어가 필요한 이유

### 기록할 것
- 동의어 적용 전/후 각 쿼리의 결과 수
- → 03-synonym-experiments.md에서 개선

---

## 실험 2-4. 필드별 검색 범위 차이

```bash
# 특정 필드만 검색
curl -X POST "http://localhost:9200/products/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match": {"product_name": "패딩"}}, "size": 5}'

curl -X POST "http://localhost:9200/products/_search?pretty" \
  -H "Content-Type: application/json" \
  -d '{"query": {"match": {"brand": "나이키"}}, "size": 5}'
```

---

## 핵심 개념 정리 (실험 후 스스로 채우기)

| 개념 | 내 이해 |
|------|--------|
| BM25란? | |
| TF-IDF와 BM25 차이 | |
| Nori decompound_mode 3가지 | |
| boost 파라미터 역할 | |
| index_analyzer vs search_analyzer 왜 다른가 | |
