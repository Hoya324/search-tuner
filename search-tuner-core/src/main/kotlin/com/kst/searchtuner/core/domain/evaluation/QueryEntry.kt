package com.kst.searchtuner.core.domain.evaluation

data class QueryEntry(
    val id: String,
    val query: String,
    val intent: String,
    val expectedRelevant: List<ProductRelevance>,
    val expectedIrrelevant: List<Long> = emptyList()
)

data class ProductRelevance(
    val productId: Long,
    val relevance: Int
)
