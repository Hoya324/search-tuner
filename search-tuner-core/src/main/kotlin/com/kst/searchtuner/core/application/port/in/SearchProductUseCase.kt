package com.kst.searchtuner.core.application.port.`in`

data class SearchProductQuery(
    val query: String,
    val from: Int = 0,
    val size: Int = 10,
    val indexName: String = "products",
    val explain: Boolean = false,
    val highlight: Boolean = true
)

data class SearchHit(
    val productId: Long,
    val productName: String,
    val brand: String?,
    val category: String,
    val score: Double,
    val price: Double? = null,
    val highlights: Map<String, List<String>> = emptyMap(),
    val explanation: String? = null
)

data class SearchResult(
    val hits: List<SearchHit>,
    val total: Long,
    val took: Long
)

interface SearchProductUseCase {
    fun search(query: SearchProductQuery): SearchResult
}
