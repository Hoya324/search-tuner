# 04. 분석기 실험 — Nori 설정 비교와 추천

## 배경: 분석기가 검색 품질에 미치는 영향

분석기 = 텍스트를 토큰으로 쪼개는 파이프라인.
잘못된 분석기 설정 → 아무리 동의어를 잘 만들어도 검색이 안 됨.

---

## 실험 4-1. decompound_mode 3가지 비교

### 같은 텍스트, 다른 분석기로 토크나이징

```bash
# none: 복합명사 분해 안 함
curl -X POST "http://localhost:9200/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenizer": {
      "type": "nori_tokenizer",
      "decompound_mode": "none"
    },
    "text": "에어맥스운동화"
  }'

# discard: 분해만 (원형 버림)
curl -X POST "http://localhost:9200/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenizer": {"type": "nori_tokenizer", "decompound_mode": "discard"},
    "text": "에어맥스운동화"
  }'

# mixed: 원형 + 분해 모두 유지 (권장)
curl -X POST "http://localhost:9200/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenizer": {"type": "nori_tokenizer", "decompound_mode": "mixed"},
    "text": "에어맥스운동화"
  }'
```

### 결과 기록표

| 텍스트 | none | discard | mixed |
|--------|------|---------|-------|
| 에어맥스운동화 | | | |
| 롱패딩자켓 | | | |
| 무선이어폰케이스 | | | |
| 스마트워치밴드 | | | |

### 검색 영향 분석

`discard` 모드에서 `에어맥스운동화` → `에어맥스`, `운동화` 로만 색인됨
→ `에어맥스운동화` 전체로 검색하면 히트 안 됨
`mixed` 모드 → `에어맥스운동화`, `에어맥스`, `운동화` 모두 색인
→ 어떤 방식으로 검색해도 히트

---

## 실험 4-2. nori_part_of_speech 필터 효과

```bash
# POS 필터 없이 분석
curl -X POST "http://localhost:9200/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenizer": {"type": "nori_tokenizer", "decompound_mode": "mixed"},
    "text": "나이키의 운동화를 사고 싶다"
  }'

# POS 필터 추가 (조사, 어미 제거)
curl -X POST "http://localhost:9200/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenizer": {"type": "nori_tokenizer", "decompound_mode": "mixed"},
    "filter": [{"type": "nori_part_of_speech", "stoptags": ["E","IC","J","MAG","MM","NA","NR","SC","SE","SF","SH","SN","SP","SSC","SSO","SY","UNA","UNKNOWN","VA","VCN","VCP","VSV","VV","VX","XPN","XR","XSA","XSN","XSV"]}],
    "text": "나이키의 운동화를 사고 싶다"
  }'
```

### 관찰 포인트
- `의`, `를`, `고`, `싶다` 같은 조사/어미가 제거되는가?
- 검색 쿼리 `나이키 운동화 구매` 입력 시 실제 매칭에 필요한 토큰만 남는가?

---

## 실험 4-3. LLM 분석기 추천 실험

```bash
# 카테고리별 추천 요청
curl -X POST "http://localhost:8080/api/v1/analyzers/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "indexName": "products",
    "sampleFields": ["product_name", "brand"],
    "sampleSize": 100,
    "userContext": "패션/의류 커머스 검색 최적화"
  }'
```

### 관찰 포인트
- LLM이 어떤 분석기 설정을 추천하는가?
- 추천 이유가 합리적인가?
- 현재 설정과 어떻게 다른가?

---

## 실험 4-4. 분석기 A/B 비교

```bash
# 두 분석기 설정 비교
curl -X POST "http://localhost:8080/api/v1/analyzers/compare" \
  -H "Content-Type: application/json" \
  -d '{
    "indexName": "products",
    "analyzerA": {
      "name": "current_nori",
      "decompoundMode": "mixed"
    },
    "analyzerB": {
      "name": "aggressive_nori",
      "decompoundMode": "discard"
    },
    "testTexts": [
      "나이키에어맥스운동화",
      "삼성갤럭시워치",
      "애플에어팟프로2세대"
    ]
  }'
```

### 비교 관점
1. **토큰 수**: 많을수록 recall 유리, 적을수록 precision 유리
2. **원형 보존**: mixed는 `에어맥스운동화`도 토큰으로 남김 → 정확한 복합명사 검색 가능
3. **색인 크기**: discard < mixed (토큰 수 차이)

---

## 실험 4-5. 사용자 정의 사전 효과

### 브랜드명 사전 추가

ES는 nori에 사용자 사전(`userdict`)을 지원함. 브랜드명/고유명사를 사전에 추가하면 쪼개지지 않음.

```bash
# 사전 없이: "에어팟" → "에어" + "팟" 으로 쪼개질 수 있음
# 사전 추가 후: "에어팟" → "에어팟" (단일 토큰)

# 현재 분석기가 브랜드명을 어떻게 처리하는지 확인
curl -X POST "http://localhost:9200/products/_analyze?pretty" \
  -H "Content-Type: application/json" \
  -d '{"analyzer": "nori_index", "text": "에어팟 갤럭시버즈 갤럭시워치"}'
```

### 학습 포인트
- 어떤 브랜드명이 잘못 분해되는가?
- 사전 추가가 필요한 브랜드 목록 직접 작성해보기

---

## 핵심 개념 정리

| 개념 | 내 이해 |
|------|--------|
| index_analyzer vs search_analyzer 왜 다른가 | |
| decompound_mode: mixed가 권장되는 이유 | |
| nori_part_of_speech의 stoptags 역할 | |
| 사용자 정의 사전이 필요한 경우 | |
| 분석기 변경이 반드시 재색인을 요구하는 이유 | |
