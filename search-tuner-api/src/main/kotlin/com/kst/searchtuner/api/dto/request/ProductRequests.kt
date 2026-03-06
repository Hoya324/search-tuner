package com.kst.searchtuner.api.dto.request

import java.math.BigDecimal

data class CreateProductRequest(
    val shopId: Long,
    val productName: String,
    val description: String? = null,
    val brand: String? = null,
    val category: String,
    val price: BigDecimal? = null
)

data class SearchRequest(
    val query: String,
    val from: Int = 0,
    val size: Int = 10,
    val indexName: String = "products",
    val explain: Boolean = false,
    val highlight: Boolean = true
)

data class AnalyzeTextRequest(
    val text: String,
    val indexName: String = "products",
    val analyzerName: String = "korean_search"
)
