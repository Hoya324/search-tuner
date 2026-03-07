package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import java.time.LocalDateTime

data class SystemStatusResponse(
    val elasticsearch: EsHealth,
    val mysql: DbHealth
) {
    data class EsHealth(val connected: Boolean, val documentCount: Long)
    data class DbHealth(val connected: Boolean)
}

data class IndexStatusResponse(
    val mysql: MysqlStatus,
    val elasticsearch: EsStatus,
    val indexConfig: IndexConfigInfo,
    val indexHistory: List<RecentJob>
) {
    data class MysqlStatus(val totalProducts: Long, val totalShops: Long)
    data class EsStatus(val connected: Boolean, val documentCount: Long, val indexExists: Boolean)
    data class IndexConfigInfo(val indexName: String, val analyzerName: String)
    data class RecentJob(val jobId: String, val type: String, val status: String)
}

data class EvaluationMetricsResponse(
    val chartData: List<EvaluationChartPoint>,
    val metricsComparison: List<MetricComparisonItem>,
    val improvedQueries: List<QueryDiffResponse>,
    val degradedQueries: List<QueryDiffResponse>,
    val llmJudge: LlmJudgeInfo
) {
    data class EvaluationChartPoint(
        val configLabel: String,
        val ndcgAt10: Double,
        val precisionAt5: Double,
        val mrr: Double,
        val createdAt: LocalDateTime
    )

    data class MetricComparisonItem(
        val metric: String,
        val valueA: Double?,
        val valueB: Double?,
        val delta: Double?
    )

    data class LlmJudgeInfo(val available: Boolean)

    companion object {
        fun from(evaluations: List<EvaluationResult>): EvaluationMetricsResponse {
            val chartData = evaluations.map {
                EvaluationChartPoint(it.configLabel, it.ndcgAt10, it.precisionAt5, it.mrr, it.createdAt)
            }

            val sorted = evaluations.sortedByDescending { it.createdAt }
            val latest = sorted.firstOrNull()
            val previous = sorted.getOrNull(1)

            val metricsComparison = if (latest != null && previous != null) {
                listOf(
                    MetricComparisonItem("nDCG@10", previous.ndcgAt10, latest.ndcgAt10, latest.ndcgAt10 - previous.ndcgAt10),
                    MetricComparisonItem("P@5", previous.precisionAt5, latest.precisionAt5, latest.precisionAt5 - previous.precisionAt5),
                    MetricComparisonItem("MRR", previous.mrr, latest.mrr, latest.mrr - previous.mrr)
                )
            } else emptyList()

            val diffs = if (latest != null && previous != null) {
                latest.perQueryScores.zip(previous.perQueryScores).map { (b, a) ->
                    QueryDiffResponse(b.queryId, b.query, a.ndcgAt10, b.ndcgAt10, b.ndcgAt10 - a.ndcgAt10,
                        if (a.ndcgAt10 > 0) ((b.ndcgAt10 - a.ndcgAt10) / a.ndcgAt10) * 100 else 0.0)
                }.sortedByDescending { it.delta }
            } else emptyList()

            return EvaluationMetricsResponse(
                chartData = chartData,
                metricsComparison = metricsComparison,
                improvedQueries = diffs.filter { it.delta > 0 }.take(5),
                degradedQueries = diffs.filter { it.delta < 0 }.takeLast(5).reversed(),
                llmJudge = LlmJudgeInfo(available = false)
            )
        }
    }
}
