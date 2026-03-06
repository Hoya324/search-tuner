package com.kst.searchtuner.api.dto.request

data class RunEvaluationRequest(
    val configLabel: String,
    val indexName: String = "products",
    val querySetId: String? = null,
    val useLlmJudge: Boolean = false
)

data class CompareEvaluationRequest(
    val configLabelA: String,
    val configLabelB: String
)

data class CreateQuerySetRequest(
    val id: String,
    val queries: List<QueryEntryRequest>
)

data class QueryEntryRequest(
    val id: String,
    val query: String,
    val intent: String,
    val expectedRelevant: List<ProductRelevanceRequest>,
    val expectedIrrelevant: List<Long> = emptyList()
)

data class ProductRelevanceRequest(
    val productId: Long,
    val relevance: Int
)
