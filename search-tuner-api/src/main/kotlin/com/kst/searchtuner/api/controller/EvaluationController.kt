package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.request.CompareEvaluationRequest
import com.kst.searchtuner.api.dto.request.CreateQuerySetRequest
import com.kst.searchtuner.api.dto.request.RunEvaluationRequest
import com.kst.searchtuner.api.dto.response.ComparisonReportResponse
import com.kst.searchtuner.api.dto.response.EvaluationMetricsResponse
import com.kst.searchtuner.api.dto.response.EvaluationResponse
import com.kst.searchtuner.core.application.port.`in`.CompareEvaluationCommand
import com.kst.searchtuner.core.application.port.`in`.EvaluateSearchQualityUseCase
import com.kst.searchtuner.core.application.port.`in`.RunEvaluationCommand
import com.kst.searchtuner.core.domain.evaluation.ProductRelevance
import com.kst.searchtuner.core.domain.evaluation.QueryEntry
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/evaluation")
@Tag(name = "Evaluation", description = "Search quality evaluation with IR metrics")
class EvaluationController(
    private val evaluateSearchQualityUseCase: EvaluateSearchQualityUseCase
) {

    @PostMapping("/run")
    @Operation(summary = "Run search quality evaluation (nDCG@10, P@5, MRR)")
    fun runEvaluation(@RequestBody request: RunEvaluationRequest): EvaluationResponse =
        EvaluationResponse.from(
            evaluateSearchQualityUseCase.runEvaluation(
                RunEvaluationCommand(
                    configLabel = request.configLabel,
                    indexName = request.indexName,
                    querySetId = request.querySetId,
                    useLlmJudge = request.useLlmJudge
                )
            )
        )

    @PostMapping("/compare")
    @Operation(summary = "Compare two evaluation results with paired t-test")
    fun compareEvaluations(@RequestBody request: CompareEvaluationRequest): ComparisonReportResponse =
        ComparisonReportResponse.from(
            evaluateSearchQualityUseCase.compareEvaluations(
                CompareEvaluationCommand(request.configLabelA, request.configLabelB)
            )
        )

    @GetMapping("/{id}/report")
    @Operation(summary = "Get evaluation result by ID")
    fun getReport(@PathVariable id: Long): ResponseEntity<EvaluationResponse> {
        val result = evaluateSearchQualityUseCase.getEvaluationById(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(EvaluationResponse.from(result))
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get aggregated evaluation metrics for charts and comparison")
    fun getMetrics(): EvaluationMetricsResponse =
        EvaluationMetricsResponse.from(evaluateSearchQualityUseCase.getAllEvaluations())

    @GetMapping("/query-sets")
    @Operation(summary = "List available query set IDs")
    fun getQuerySets(): List<String> = evaluateSearchQualityUseCase.getQuerySets()

    @PostMapping("/query-sets")
    @Operation(summary = "Create or replace a custom query set")
    fun createQuerySet(@RequestBody request: CreateQuerySetRequest): Map<String, Any> {
        val entries = request.queries.map { q ->
            QueryEntry(
                id = q.id,
                query = q.query,
                intent = q.intent,
                expectedRelevant = q.expectedRelevant.map { ProductRelevance(it.productId, it.relevance) },
                expectedIrrelevant = q.expectedIrrelevant
            )
        }
        evaluateSearchQualityUseCase.saveQuerySet(request.id, entries)
        return mapOf("querySetId" to request.id, "queryCount" to entries.size)
    }
}
