package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.application.port.`in`.ComparisonReport
import com.kst.searchtuner.core.application.port.`in`.QueryDiff
import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import java.time.LocalDateTime

data class EvaluationResponse(
    val id: Long,
    val configLabel: String,
    val querySetId: String?,
    val ndcgAt10: Double,
    val precisionAt5: Double,
    val mrr: Double,
    val queryCount: Int,
    val createdAt: LocalDateTime
) {
    companion object {
        fun from(result: EvaluationResult) = EvaluationResponse(
            id = result.id,
            configLabel = result.configLabel,
            querySetId = result.querySetId,
            ndcgAt10 = result.ndcgAt10,
            precisionAt5 = result.precisionAt5,
            mrr = result.mrr,
            queryCount = result.queryCount,
            createdAt = result.createdAt
        )
    }
}

data class QueryDiffResponse(
    val queryId: String,
    val query: String,
    val scoreA: Double,
    val scoreB: Double,
    val delta: Double,
    val deltaPercent: Double
)

data class ComparisonReportResponse(
    val configLabelA: String,
    val configLabelB: String,
    val metricsA: MetricsSummary,
    val metricsB: MetricsSummary,
    val ndcgDelta: Double,
    val ndcgDeltaPercent: Double,
    val precisionDelta: Double,
    val mrrDelta: Double,
    val pValue: Double,
    val isSignificant: Boolean,
    val significanceLabel: String,
    val topImprovedQueries: List<QueryDiffResponse>,
    val topDegradedQueries: List<QueryDiffResponse>
) {
    data class MetricsSummary(val ndcgAt10: Double, val precisionAt5: Double, val mrr: Double)

    companion object {
        fun from(report: ComparisonReport) = ComparisonReportResponse(
            configLabelA = report.configLabelA,
            configLabelB = report.configLabelB,
            metricsA = MetricsSummary(report.resultA.ndcgAt10, report.resultA.precisionAt5, report.resultA.mrr),
            metricsB = MetricsSummary(report.resultB.ndcgAt10, report.resultB.precisionAt5, report.resultB.mrr),
            ndcgDelta = report.ndcgDelta,
            ndcgDeltaPercent = if (report.resultA.ndcgAt10 > 0) (report.ndcgDelta / report.resultA.ndcgAt10) * 100 else 0.0,
            precisionDelta = report.precisionDelta,
            mrrDelta = report.mrrDelta,
            pValue = report.pValue,
            isSignificant = report.isSignificant,
            significanceLabel = if (report.isSignificant) "통계적으로 유의한 차이 (p < 0.05)" else "통계적으로 유의하지 않음 (p >= 0.05)",
            topImprovedQueries = report.topImprovedQueries.map { it.toResponse() },
            topDegradedQueries = report.topDegradedQueries.map { it.toResponse() }
        )

        private fun QueryDiff.toResponse() = QueryDiffResponse(
            queryId = queryId,
            query = query,
            scoreA = scoreA,
            scoreB = scoreB,
            delta = delta,
            deltaPercent = if (scoreA > 0) (delta / scoreA) * 100 else 0.0
        )
    }
}
