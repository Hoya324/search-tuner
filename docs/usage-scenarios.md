# Search Tuner 실무 사용 시나리오

## 전체 워크플로우
상품 등록 → 분석기 확인 → 동의어 생성/적용 → 검색 테스트 → 품질 측정

---

## 시나리오 1: 신규 카테고리 런칭 (골프 용품)
**문제**: "드라이버"로 검색하면 자동차 부품이 나옴

### 단계별 실행
1. Admin → 골프 용품 가게/상품 CSV 임포트 (sample-data/scenario1-golf-* 파일 사용)
2. Data → 전체 재색인
3. Search Test → "드라이버" 검색 → 현재 결과 확인 (문제 재현)
4. Analyzer Lab → "드라이버 클럽" 입력 → 토큰화 결과 확인
5. Synonyms → 특정 상품명 모드: "드라이버 클럽" 입력 → AI 동의어 생성
   - 기대 결과: [드라이버, 드라이버클럽, 우드, 1번우드] 그룹
6. Synonyms → 미리보기 확인 후 RELOAD 적용
7. Search Test → "드라이버" 재검색 → 골프 상품 상단 확인
8. Quality → baseline vs synonym-applied 비교

### 체크포인트
- [ ] 재색인 완료 (Docs 수: 0 → N)
- [ ] 동의어 적용 완료 (synonyms.txt 업데이트)
- [ ] "드라이버" 검색 시 골프 상품 1위

---

## 시나리오 2: 시즌 이벤트 대응 (여름 패션)
**문제**: "나시 원피스" / "민소매 원피스" / "슬리브리스"가 다른 상품으로 분산됨

### 단계별 실행
1. Admin → 여름 패션 가게/상품 CSV 임포트 (sample-data/scenario2-fashion-* 파일 사용)
2. Data → 전체 재색인
3. Search Test → "나시 원피스" vs "민소매 원피스" 각각 검색 → 결과 비교
4. Synonyms → AI 동의어 생성 (카테고리: 패션)
   - 기대 결과: [나시, 민소매, 슬리브리스, 노슬리브] 그룹
5. 검토 후 적용
6. Search Test → Config A(적용 전) / Config B(적용 후) 나란히 비교
   - "나시 원피스" 검색 → B에서 민소매 상품도 나오는지 확인

---

## 시나리오 3: 브랜드명 오타/약칭 처리 (전자기기)
**문제**: "블투 이어폰", "에어팟 호환", "갤럭탭" 등 고객 오타로 검색 실패

### 단계별 실행
1. Admin → 전자기기 가게/상품 CSV 임포트 (sample-data/scenario3-electronics-* 파일 사용)
2. Data → 전체 재색인
3. Search Test → "블투", "에어팟호환", "갤탭" 검색 → 결과 없음 확인
4. Synonyms → 특정 상품명 모드로 각각 생성
   - "블루투스 이어폰" → [블루투스, 블투, BT] 기대
   - "삼성 갤럭시탭" → [갤럭시탭, 갤탭, Galaxy Tab] 기대
5. 동의어 적용 후 Search Test 재확인

---

## 시나리오 4: 검색 품질 정기 리뷰
**문제**: 월 1회 "동의어 적용 전후 효과 수치화" 필요

### 단계별 실행
1. Quality 페이지 → Config A: baseline, Config B: current
2. 비교 실행 → nDCG@10, MRR 수치 확인
3. 하락한 쿼리 목록 → 문제 키워드 파악
4. Analyzer Lab → 해당 키워드 토큰 분석
5. 원인에 따라: 동의어 추가 or 분석기 설정 변경

---

## CSV 포맷

### 가게 (shops)
```csv
name,description,category
가게이름,가게설명,카테고리
```

### 상품 (products)
```csv
shopId,productName,description,brand,category,price
1,상품명,상품설명,브랜드,카테고리,가격
```

샘플 파일: `docs/sample-data/` 폴더 참고
