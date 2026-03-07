package com.kst.searchtuner.core.application.port.`in`

import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import com.kst.searchtuner.core.domain.evaluation.QueryEntry

data class RunEvaluationCommand(
    val configLabel: String,
    val indexName: String,
    val querySetId: String? = null,
    val customQueries: List<QueryEntry> = emptyList(),
    val useLlmJudge: Boolean = false
)

data class CompareEvaluationCommand(
    val configLabelA: String,
    val configLabelB: String
)

data class ComparisonReport(
    val configLabelA: String,
    val configLabelB: String,
    val resultA: EvaluationResult,
    val resultB: EvaluationResult,
    val ndcgDelta: Double,
    val precisionDelta: Double,
    val mrrDelta: Double,
    val pValue: Double,
    val isSignificant: Boolean,
    val topImprovedQueries: List<QueryDiff>,
    val topDegradedQueries: List<QueryDiff>
)

data class QueryDiff(
    val queryId: String,
    val query: String,
    val scoreA: Double,
    val scoreB: Double,
    val delta: Double
)

interface EvaluateSearchQualityUseCase {
    fun runEvaluation(command: RunEvaluationCommand): EvaluationResult
    fun compareEvaluations(command: CompareEvaluationCommand): ComparisonReport
    fun getEvaluationById(id: Long): EvaluationResult?
    fun getAllEvaluations(): List<EvaluationResult>
    fun getQuerySets(): List<String>
    fun saveQuerySet(id: String, entries: List<QueryEntry>)
}
