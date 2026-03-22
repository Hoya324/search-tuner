package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.request.AnalyzeTextSimpleRequest
import com.kst.searchtuner.api.dto.request.CompareAnalyzerRequest
import com.kst.searchtuner.api.dto.request.RecommendAnalyzerRequest
import com.kst.searchtuner.api.dto.response.AnalyzerComparisonResponse
import com.kst.searchtuner.api.dto.response.AnalyzerRecommendationResponse
import com.kst.searchtuner.core.application.port.`in`.AnalyzeTextQuery
import com.kst.searchtuner.core.application.port.`in`.RecommendAnalyzerUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/analyzers")
@Tag(name = "Analyzers", description = "Nori analyzer recommendation and comparison")
class AnalyzerController(
    private val recommendAnalyzerUseCase: RecommendAnalyzerUseCase
) {

    @PostMapping("/recommend")
    @Operation(summary = "LLM-powered Nori analyzer recommendation for a given domain")
    fun recommend(@RequestBody request: RecommendAnalyzerRequest): AnalyzerRecommendationResponse =
        AnalyzerRecommendationResponse.from(
            recommendAnalyzerUseCase.recommend(request.domain, request.sampleTexts)
        )

    @PostMapping("/compare")
    @Operation(summary = "Compare tokenization output across multiple analyzer configs")
    fun compare(@RequestBody request: CompareAnalyzerRequest): AnalyzerComparisonResponse =
        AnalyzerComparisonResponse.from(
            recommendAnalyzerUseCase.compare(request.sampleTexts, request.configNames)
        )

    @PostMapping("/analyze")
    @Operation(summary = "Analyze text with multiple analyzer configurations")
    fun analyze(@RequestBody request: AnalyzeTextSimpleRequest): Map<String, Any> {
        val configs = listOf("korean_search", "standard")
        val results = configs.map { analyzerName ->
            try {
                val result = recommendAnalyzerUseCase.analyzeText(
                    AnalyzeTextQuery(text = request.text, analyzerName = analyzerName)
                )
                mapOf(
                    "configId" to analyzerName,
                    "configName" to analyzerName,
                    "mode" to analyzerName,
                    "tokens" to result.tokens,
                    "recommended" to (analyzerName == "korean_search"),
                    "error" to null
                )
            } catch (e: Exception) {
                mapOf(
                    "configId" to analyzerName,
                    "configName" to analyzerName,
                    "mode" to analyzerName,
                    "tokens" to emptyList<String>(),
                    "recommended" to (analyzerName == "korean_search"),
                    "error" to (e.message ?: "분석기 호출 실패")
                )
            }
        }
        return mapOf(
            "results" to results,
            "recommendation" to "korean_search 분석기를 권장합니다."
        )
    }
}
