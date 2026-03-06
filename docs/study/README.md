# Search Tuner 실험 연구 로드맵

이 프로젝트로 직접 실험하고 측정하면서 배울 수 있는 항목 목록.
각 실험은 **가설 → 실행 절차 → 측정 지표 → 예상 학습** 구조로 정리.

---

## 실험 진행 순서 (권장)

```
[0단계] 기본 세팅 확인
  → 01-setup.md

[1단계] 검색 동작 이해
  → 02-search-basics.md

[2단계] 동의어로 검색 개선
  → 03-synonym-experiments.md

[3단계] 분석기 비교
  → 04-analyzer-experiments.md

[4단계] 검색 품질 정량 측정
  → 05-evaluation-experiments.md

[5단계] LLM 프롬프트 튜닝
  → 06-llm-prompt-tuning.md
```

---

## 파일 목록

| 파일 | 주제 |
|------|------|
| [01-setup.md](01-setup.md) | 첫 색인 생성, 데이터 확인, 기본 검색 동작 확인 |
| [02-search-basics.md](02-search-basics.md) | 검색 쿼리 구조, 스코어링, 한국어 토크나이징 이해 |
| [03-synonym-experiments.md](03-synonym-experiments.md) | 동의어 생성·적용·효과 측정 |
| [04-analyzer-experiments.md](04-analyzer-experiments.md) | nori 설정 비교, 분석기 추천 실험 |
| [05-evaluation-experiments.md](05-evaluation-experiments.md) | nDCG·MRR·P@5 측정, A/B 비교, 통계 유의성 검증 |
| [06-llm-prompt-tuning.md](06-llm-prompt-tuning.md) | LLM 프롬프트 개선, 응답 품질 향상 실험 |
