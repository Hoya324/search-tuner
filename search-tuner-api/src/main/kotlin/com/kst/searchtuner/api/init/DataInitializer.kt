package com.kst.searchtuner.api.init

import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.application.port.out.ShopPersistencePort
import com.kst.searchtuner.core.domain.product.Product
import com.kst.searchtuner.core.domain.shop.Shop
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.util.concurrent.atomic.AtomicLong

@Component
@Profile("!test")
class DataInitializer(
    private val shopPersistencePort: ShopPersistencePort,
    private val productPersistencePort: ProductPersistencePort
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(javaClass)
    private val productIdSeq = AtomicLong(1)

    override fun run(args: ApplicationArguments) {
        if (productPersistencePort.countAll() > 0) {
            log.info("Data already initialized, skipping")
            return
        }
        log.info("Initializing sample data: 100 shops, 10,000 products")
        val shops = createShops()
        val saved = shopPersistencePort.saveAll(shops)
        createProducts(saved)
        log.info("Sample data initialized")
    }

    private fun createShops(): List<Shop> = CATEGORIES.flatMapIndexed { catIdx, category ->
        (1..10).map { i ->
            Shop(
                name = "${SHOP_BRAND_PREFIXES[catIdx % SHOP_BRAND_PREFIXES.size]}${i}호점",
                description = "$category 전문 쇼핑몰",
                category = category
            )
        }
    }

    private fun createProducts(shops: List<Shop>) {
        val allProducts = mutableListOf<Product>()
        shops.forEach { shop ->
            val productsPerShop = 100
            repeat(productsPerShop) { idx ->
                allProducts.add(generateProduct(shop, idx))
            }
        }
        allProducts.chunked(500).forEach { chunk ->
            productPersistencePort.saveAll(chunk)
        }
    }

    private fun generateProduct(shop: Shop, idx: Int): Product {
        val templates = PRODUCT_TEMPLATES[shop.category] ?: PRODUCT_TEMPLATES["기타"]!!
        val template = templates[idx % templates.size]
        val brand = BRANDS_BY_CATEGORY[shop.category]?.random() ?: "노브랜드"
        val variant = VARIANTS[idx % VARIANTS.size]
        val priceRange = PRICE_RANGES[shop.category] ?: (10_000..500_000)

        return Product(
            shopId = shop.id,
            productName = buildProductName(brand, template, variant, idx),
            description = buildDescription(shop.category, brand, template),
            brand = brand,
            category = shop.category,
            price = BigDecimal((priceRange.random() / 100) * 100)
        )
    }

    private fun buildProductName(brand: String, template: String, variant: String, idx: Int): String {
        val withBrand = "${brand} ${template}"
        return when (idx % 5) {
            0 -> withBrand
            1 -> "${withBrand} ${variant}"
            2 -> "${template} ${variant}" // 브랜드 없는 버전
            3 -> buildAbbreviated(brand, template, variant)
            else -> buildTypo(withBrand)
        }
    }

    private fun buildAbbreviated(brand: String, template: String, variant: String): String {
        val abbr = BRAND_ABBREVS[brand] ?: brand.take(2)
        return "${abbr} ${template} ${variant}"
    }

    private fun buildTypo(name: String): String {
        val typos = mapOf("블루투스" to "블루투쓰", "이어폰" to "이여폰", "패딩" to "파딩", "청소기" to "청소긔")
        return typos.entries.fold(name) { acc, (k, v) -> acc.replace(k, v) }
    }

    private fun buildDescription(category: String, brand: String, template: String): String =
        "[$category] ${brand}의 ${template}. 최고의 품질과 합리적인 가격으로 제공합니다."

    companion object {
        val CATEGORIES = listOf("패션/의류", "전자제품", "스포츠/아웃도어", "뷰티/화장품", "생활가전", "식품/건강", "가구/인테리어", "도서/문구", "완구/취미", "기타")

        val SHOP_BRAND_PREFIXES = listOf("스타일", "디지털", "아웃도어", "뷰티", "홈리빙", "웰니스", "인테리어", "북스", "플레이", "라이프")

        val PRODUCT_TEMPLATES = mapOf(
            "패션/의류" to listOf(
                "남성 롱패딩", "여성 숏패딩", "오리털 다운자켓", "거위털 패딩베스트",
                "청바지 슬림핏", "와이드 데님팬츠", "면 티셔츠", "후드집업",
                "무스탕 자켓", "가죽 바이커자켓", "린넨 셔츠", "쉬폰 블라우스",
                "미니 원피스", "맥시 스커트", "트레이닝복 세트", "운동화 스니커즈",
                "캐시미어 코트", "울 트렌치코트", "니트 가디건", "맨투맨 스웨트셔츠"
            ),
            "전자제품" to listOf(
                "무선 블루투스 이어폰", "노이즈캔슬링 헤드폰", "TWS 이어버드",
                "스마트워치 GPS", "스마트밴드 피트니스", "태블릿 10인치",
                "노트북 울트라북", "기계식 키보드 텐키리스", "무선 마우스",
                "4K UHD 모니터", "외장 SSD 1TB", "USB-C 허브",
                "보조배터리 20000mAh", "무선 충전기 패드", "웹캠 FHD",
                "블루투스 스피커 방수", "스마트홈 허브", "공기청정기 미세먼지",
                "로봇청소기 자동비움", "전동칫솔 음파"
            ),
            "스포츠/아웃도어" to listOf(
                "러닝화 남성", "러닝화 여성", "등산화 방수", "트레킹화 경량",
                "등산복 윈드쉘", "기능성 레깅스", "사이클링 저지", "수영복 래쉬가드",
                "요가매트 6mm", "폼롤러 마사지", "덤벨 세트 20kg",
                "운동 배낭 35L", "캠핑 텐트 4인용", "침낭 영하15도",
                "등산 스틱 접이식", "헬스장갑 논슬립", "무릎보호대 스포츠",
                "줄넘기 속도", "미니밴드 저항", "짐볼 65cm"
            ),
            "뷰티/화장품" to listOf(
                "수분크림 히알루론산", "선크림 SPF50+", "에센스 세럼",
                "파운데이션 쿠션", "립스틱 매트", "마스카라 볼륨",
                "아이섀도 팔레트", "클렌징폼 약산성", "토너 스킨",
                "앰플 비타민C", "마스크팩 10매", "비비크림 커버",
                "아이크림 안티에이징", "핸드크림 보습", "립밤 자외선차단",
                "향수 플로럴", "샴푸 두피케어", "트리트먼트 손상모",
                "바디로션 수분", "네일폴리시 젤"
            ),
            "생활가전" to listOf(
                "로봇청소기 매핑", "스틱청소기 무선", "드럼세탁기 15kg",
                "건조기 히트펌프", "냉장고 4도어", "전자레인지 30L",
                "에어프라이어 5.5L", "전기압력밥솥 6인", "블렌더 고속",
                "커피메이커 드립", "식기세척기 빌트인", "인덕션 2구",
                "공기청정기 20평", "가습기 초음파", "제습기 12L",
                "전기히터 온풍", "선풍기 DC모터", "에어컨 인버터",
                "정수기 직수형", "음식물처리기"
            ),
            "식품/건강" to listOf(
                "단백질 보충제 초콜릿", "종합비타민 성인", "오메가3 생선유",
                "프로바이오틱스 유산균", "콜라겐 펩타이드", "홍삼정 6년근",
                "마그네슘 수면", "루테인 눈 건강", "관절 건강 글루코사민",
                "다이어트 식이섬유", "철분 여성", "칼슘 비타민D",
                "닭가슴살 훈제", "그래놀라 저당", "두유 무가당",
                "녹차 티백", "혼합잡곡 20곡", "현미밥 즉석",
                "견과류 혼합", "쌀과자 무설탕"
            ),
            "가구/인테리어" to listOf(
                "소파 3인용", "침대 프레임 퀸", "매트리스 독립스프링",
                "책상 높이조절", "의자 메쉬 사무용", "책장 5단",
                "옷장 슬라이딩", "식탁 4인용", "커피테이블 원목",
                "조명 LED 거실", "커튼 암막 블랙아웃", "러그 거실용",
                "수납박스 정리", "행거 이동식", "신발장 6단",
                "화분 모듈형", "벽시계 무소음", "액자 A4",
                "선반 브라켓", "캐비닛 서랍형"
            ),
            "도서/문구" to listOf(
                "다이어리 위클리", "노트북 A5", "만년필 세트",
                "형광펜 10색", "포스트잇 세트", "클리어파일 30매",
                "가위 고급 문구", "테이프 투명", "자 스테인리스",
                "스테이플러 중형", "지우개 고무", "연필 2B",
                "색연필 36색", "수채화 물감", "스케치북 A3",
                "캘리그라피 펜", "줄공책 100매", "인덱스 탭 컬러",
                "바인더 링", "파일철 40매"
            ),
            "완구/취미" to listOf(
                "레고 시티 세트", "블록 교육용", "로봇 코딩 키트",
                "보드게임 가족", "퍼즐 1000조각", "피규어 애니메이션",
                "다이캐스트 자동차", "드론 입문용", "RC카 오프로드",
                "낚시 릴 스피닝", "낚시대 루어", "골프 퍼터",
                "탁구 라켓 세트", "배드민턴 셔틀콕", "인라인스케이트",
                "킥보드 접이식", "물총 대형", "슬라임 만들기 키트",
                "비즈 공예", "냅킨 아트"
            ),
            "기타" to listOf(
                "반려동물 사료 고양이", "개 간식 트릿", "고양이 화장실",
                "강아지 리드줄", "반려동물 침대", "자동차 방향제",
                "세차용품 왁스", "자동차 커버", "자전거 헬멧",
                "킥스쿠터 보호대", "여행가방 28인치", "여행 파우치 세트",
                "우산 3단 자동", "선글라스 편광", "지갑 가죽 슬림",
                "카드지갑 RFID", "열쇠고리 가죽", "벨트 자동버클",
                "모자 야구 볼캡", "가방 크로스백"
            )
        )

        val BRANDS_BY_CATEGORY = mapOf(
            "패션/의류" to listOf("캐나다구스", "노스페이스", "나이키", "Nike", "아디다스", "Adidas", "유니클로", "자라", "H&M", "무신사스탠다드"),
            "전자제품" to listOf("삼성", "Samsung", "LG", "애플", "Apple", "소니", "Sony", "보스", "Bose", "에어팟"),
            "스포츠/아웃도어" to listOf("나이키", "Nike", "아디다스", "Adidas", "뉴발란스", "뉴발", "살로몬", "블랙다이아몬드", "파타고니아", "아크테릭스"),
            "뷰티/화장품" to listOf("이니스프리", "에뛰드하우스", "더페이스샵", "아이오페", "설화수", "헤라", "3CE", "롬앤", "클리오", "토니모리"),
            "생활가전" to listOf("삼성", "Samsung", "LG", "다이슨", "Dyson", "샤오미", "코웨이", "위닉스", "쿠쿠", "일렉트로룩스"),
            "식품/건강" to listOf("정관장", "GNC", "뉴트리디데이", "스포맥스", "머슬테크", "옵티멈", "마이프로틴", "바디팩트", "탄탄면역", "한미약품"),
            "기타" to listOf("삼성", "LG", "기타", "노브랜드")
        )

        val BRAND_ABBREVS = mapOf(
            "캐나다구스" to "캐구", "노스페이스" to "노페", "나이키" to "나이키",
            "아디다스" to "아디", "뉴발란스" to "뉴발", "삼성" to "삼성",
            "다이슨" to "다이슨", "에어팟" to "에팟"
        )

        val VARIANTS = listOf(
            "남성", "여성", "남녀공용", "블랙", "화이트", "네이비", "그레이",
            "2024 신상", "베스트셀러", "프리미엄", "라이트", "프로", "플러스", "미니"
        )

        val PRICE_RANGES = mapOf(
            "패션/의류" to (19_900..1_500_000),
            "전자제품" to (9_900..2_000_000),
            "스포츠/아웃도어" to (9_900..800_000),
            "뷰티/화장품" to (3_900..300_000),
            "생활가전" to (19_900..3_000_000),
            "식품/건강" to (5_900..150_000)
        )
    }
}

private fun IntRange.random(): Int = (this.first + Math.random() * (this.last - this.first + 1)).toInt()
private fun <T> List<T>.random(): T = this[(Math.random() * size).toInt()]
