package com.kst.searchtuner.core.domain.evaluation

import java.time.LocalDateTime

data class QueryEvaluationScore(
    val queryId: String,
    val query: String,
    val ndcgAt10: Double,
    val precisionAt5: Double,
    val mrr: Double
)

data class EvaluationResult(
    val id: Long = 0,
    val configLabel: String,
    val querySetId: String? = null,
    val ndcgAt10: Double,
    val precisionAt5: Double,
    val mrr: Double,
    val queryCount: Int,
    val perQueryScores: List<QueryEvaluationScore> = emptyList(),
    val createdAt: LocalDateTime = LocalDateTime.now()
)
