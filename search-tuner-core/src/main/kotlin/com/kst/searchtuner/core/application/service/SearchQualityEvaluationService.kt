package com.kst.searchtuner.core.application.service

import com.kst.searchtuner.core.application.port.`in`.CompareEvaluationCommand
import com.kst.searchtuner.core.application.port.`in`.ComparisonReport
import com.kst.searchtuner.core.application.port.`in`.EvaluateSearchQualityUseCase
import com.kst.searchtuner.core.application.port.`in`.QueryDiff
import com.kst.searchtuner.core.application.port.`in`.RunEvaluationCommand
import com.kst.searchtuner.core.application.port.`in`.SearchProductQuery
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.EvaluationResultPort
import com.kst.searchtuner.core.application.port.out.LlmPort
import com.kst.searchtuner.core.application.service.metric.IrMetricCalculator
import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import com.kst.searchtuner.core.domain.evaluation.QueryEntry
import com.kst.searchtuner.core.domain.evaluation.QueryEvaluationScore

class SearchQualityEvaluationService(
    private val elasticsearchPort: ElasticsearchPort,
    private val llmPort: LlmPort,
    private val evaluationResultPort: EvaluationResultPort
) : EvaluateSearchQualityUseCase {

    private val querySets = mutableMapOf<String, List<QueryEntry>>()

    override fun runEvaluation(command: RunEvaluationCommand): EvaluationResult {
        val queries = resolveQueries(command)
        val perQueryScores = queries.map { entry ->
            scoreQuery(entry, command.indexName, command.useLlmJudge)
        }

        val avgNdcg = perQueryScores.map { it.ndcgAt10 }.average()
        val avgP5 = perQueryScores.map { it.precisionAt5 }.average()
        val avgMrr = perQueryScores.map { it.mrr }.average()

        val result = EvaluationResult(
            configLabel = command.configLabel,
            querySetId = command.querySetId,
            ndcgAt10 = avgNdcg,
            precisionAt5 = avgP5,
            mrr = avgMrr,
            queryCount = queries.size,
            perQueryScores = perQueryScores
        )
        return evaluationResultPort.save(result)
    }

    override fun compareEvaluations(command: CompareEvaluationCommand): ComparisonReport {
        val resultsA = evaluationResultPort.findByConfigLabel(command.configLabelA)
        val resultsB = evaluationResultPort.findByConfigLabel(command.configLabelB)

        val latestA = resultsA.maxByOrNull { it.createdAt }
            ?: error("No evaluation found for config: ${command.configLabelA}")
        val latestB = resultsB.maxByOrNull { it.createdAt }
            ?: error("No evaluation found for config: ${command.configLabelB}")

        val scoresA = latestA.perQueryScores.map { it.ndcgAt10 }
        val scoresB = latestB.perQueryScores.map { it.ndcgAt10 }

        val pValue = if (scoresA.size >= 2 && scoresA.size == scoresB.size) {
            IrMetricCalculator.pairedTTest(scoresA, scoresB)
        } else 1.0

        val diffs = latestA.perQueryScores.zip(latestB.perQueryScores).map { (a, b) ->
            QueryDiff(a.queryId, a.query, a.ndcgAt10, b.ndcgAt10, b.ndcgAt10 - a.ndcgAt10)
        }.sortedByDescending { it.delta }

        return ComparisonReport(
            configLabelA = command.configLabelA,
            configLabelB = command.configLabelB,
            resultA = latestA,
            resultB = latestB,
            ndcgDelta = latestB.ndcgAt10 - latestA.ndcgAt10,
            precisionDelta = latestB.precisionAt5 - latestA.precisionAt5,
            mrrDelta = latestB.mrr - latestA.mrr,
            pValue = pValue,
            isSignificant = pValue < 0.05,
            topImprovedQueries = diffs.take(5),
            topDegradedQueries = diffs.takeLast(3).reversed()
        )
    }

    override fun getEvaluationById(id: Long): EvaluationResult? = evaluationResultPort.findById(id)

    override fun getAllEvaluations(): List<EvaluationResult> =
        evaluationResultPort.findAll().sortedBy { it.createdAt }

    override fun getQuerySets(): List<String> = querySets.keys.toList()

    override fun saveQuerySet(id: String, entries: List<QueryEntry>) {
        querySets[id] = entries
    }

    private fun resolveQueries(command: RunEvaluationCommand): List<QueryEntry> {
        if (command.customQueries.isNotEmpty()) return command.customQueries
        if (command.querySetId != null) return querySets[command.querySetId] ?: emptyList()
        return querySets.values.flatten()
    }

    private fun scoreQuery(entry: QueryEntry, indexName: String, useLlmJudge: Boolean): QueryEvaluationScore {
        val searchQuery = SearchProductQuery(
            query = entry.query,
            size = 10,
            indexName = indexName
        )
        val result = elasticsearchPort.search(searchQuery)

        val relevanceMap = entry.expectedRelevant.associate { it.productId to it.relevance }

        val rankedRelevances = result.hits.map { hit ->
            relevanceMap[hit.productId] ?: 0
        }

        return QueryEvaluationScore(
            queryId = entry.id,
            query = entry.query,
            ndcgAt10 = IrMetricCalculator.calculateNdcgAt(10, rankedRelevances),
            precisionAt5 = IrMetricCalculator.calculatePrecisionAt(5, rankedRelevances),
            mrr = IrMetricCalculator.calculateMrr(rankedRelevances)
        )
    }
}
