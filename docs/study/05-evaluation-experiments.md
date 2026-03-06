# 05. 검색 품질 정량 평가 — nDCG·MRR·A/B 비교

## 배경: 왜 정량 지표가 필요한가

"더 좋아 보인다"는 주관적 판단이 아니라 숫자로 개선 여부를 측정해야 함.
- **nDCG@10**: 상위 10개 결과의 순위 품질 (0~1)
- **P@5**: 상위 5개 중 관련 문서 비율
- **MRR**: 첫 번째 관련 문서가 몇 위에 있는가
- **paired t-test**: A/B 차이가 통계적으로 유의한가 (p < 0.05)

---

## 실험 5-1. Golden Query Set 이해

`src/main/resources/evaluation/golden_query_set.yaml` 에 100개 쿼리 정의됨.

```bash
# 저장된 query set 확인
curl "http://localhost:8080/api/v1/evaluation/query-sets"
```

### Query Set 구조 분석

각 쿼리는 4점 척도로 관련성 레이블 보유:
- `3`: 완벽히 관련 (쿼리 의도와 정확히 일치)
- `2`: 관련 (쿼리 의도와 관련됨)
- `1`: 약간 관련 (일부만 관련)
- `0`: 무관련

### 직접 레이블링 해보기

자동 생성된 레이블이 맞는지 몇 개 직접 확인:
1. 쿼리: `나이키 운동화`
2. ES에서 결과 가져오기: `curl "http://localhost:8080/api/v1/products/search?q=나이키 운동화"`
3. 상위 10개 상품 각각에 0~3 점수 직접 부여
4. 자동 레이블과 비교

---

## 실험 5-2. 첫 평가 실행 (기준선)

```bash
# 평가 실행
curl -X POST "http://localhost:8080/api/v1/evaluation/run" \
  -H "Content-Type: application/json" \
  -d '{
    "indexName": "products",
    "querySetId": "golden",
    "configLabel": "baseline-nori-no-synonym"
  }'

# 응답:
# {
#   "id": "eval-001",
#   "ndcgAt10": 0.423,
#   "precisionAt5": 0.38,
#   "mrr": 0.51,
#   "queryCount": 100
# }
```

### 기준선 기록

| 설정 | nDCG@10 | P@5 | MRR | 비고 |
|------|---------|-----|-----|------|
| baseline (동의어 없음) | | | | |
| + 브랜드 동의어 적용 | | | | |
| + 오타 동의어 적용 | | | | |
| + decompound mixed | | | | |

---

## 실험 5-3. 동의어 적용 전후 A/B 비교

```bash
# 1. 동의어 없이 평가 (baseline)
curl -X POST "http://localhost:8080/api/v1/evaluation/run" \
  -d '{"indexName": "products", "querySetId": "golden", "configLabel": "config-A"}'

# 2. 동의어 적용
curl -X POST "http://localhost:8080/api/v1/synonyms/{id}/apply" \
  -d '{"strategy": "RELOAD", "indexName": "products"}'

# 3. 동의어 있을 때 평가
curl -X POST "http://localhost:8080/api/v1/evaluation/run" \
  -d '{"indexName": "products", "querySetId": "golden", "configLabel": "config-B"}'

# 4. 두 설정 비교 (p-value 포함)
curl -X POST "http://localhost:8080/api/v1/evaluation/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "configLabelA": "config-A",
    "configLabelB": "config-B",
    "metric": "NDCG_AT_10"
  }'
```

### 비교 결과 해석

```json
{
  "configA": {"ndcgAt10": 0.423},
  "configB": {"ndcgAt10": 0.561},
  "improvement": "+32.6%",
  "pValue": 0.003,
  "significant": true
}
```

- `pValue < 0.05` → 개선이 통계적으로 유의함
- `pValue >= 0.05` → 우연에 의한 차이일 수 있음

---

## 실험 5-4. 쿼리 타입별 성능 분석

Golden Query Set의 카테고리별로 어떤 쿼리 타입이 취약한가:

```
브랜드 동의어 쿼리 20개: 예상 nDCG 낮음 (동의어 없으면 영문 브랜드 검색 실패)
줄임말 쿼리 15개: 예상 nDCG 낮음
복합명사 쿼리 15개: decompound_mode에 따라 차이
오타 쿼리 10개: 동의어 없으면 0에 가까움
```

### 분석 방법

```bash
# 평가 상세 리포트
curl "http://localhost:8080/api/v1/evaluation/{id}/report"

# 응답에서 per_query_scores 확인
# 점수가 낮은 쿼리들 → 어떤 공통점이 있는가?
```

---

## 실험 5-5. nDCG 계산 직접 손으로 해보기

쿼리: `나이키 운동화`
결과 순위:
```
1위: 나이키 에어맥스 (relevance=3)
2위: 아디다스 스니커즈 (relevance=0)
3위: 나이키 조던 (relevance=2)
4위: 나이키 슬리퍼 (relevance=1)
5위: 리복 운동화 (relevance=0)
```

**DCG@5 계산**:
```
DCG = 3/log2(2) + 0/log2(3) + 2/log2(4) + 1/log2(5) + 0/log2(6)
    = 3/1 + 0 + 2/2 + 1/2.32 + 0
    = 3 + 0 + 1 + 0.43
    = 4.43
```

**이상적 순위 (iDCG@5)**:
```
3, 2, 1, 0, 0 순으로 정렬
iDCG = 3/1 + 2/1.58 + 1/2 + 0 + 0
     = 3 + 1.26 + 0.5
     = 4.76
```

**nDCG@5 = DCG / iDCG = 4.43 / 4.76 = 0.93**

### 학습 포인트
- 완벽한 순위면 nDCG = 1.0
- 상위에 무관련 문서가 많을수록 nDCG 급감
- 1위 문서의 가중치가 압도적으로 큼 (log2 discount)

---

## 핵심 개념 정리

| 개념 | 내 이해 |
|------|--------|
| nDCG가 AP보다 나은 점 | |
| MRR이 유용한 검색 시나리오 | |
| p-value 0.05 의 의미 | |
| 샘플 수가 적을 때 paired t-test 신뢰성 | |
| Golden Query Set 구축 비용과 품질의 트레이드오프 | |
