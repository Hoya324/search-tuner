package com.kst.searchtuner.core.application.port.`in`

import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig

data class AnalyzeTextQuery(
    val text: String,
    val indexName: String = "products",
    val analyzerName: String = "korean_search"
)

data class TokenAnalysisResult(
    val config: AnalyzerConfig,
    val tokens: List<String>
)

data class AnalyzerRecommendation(
    val recommendedConfig: AnalyzerConfig,
    val reasoning: String,
    val tradeoffs: String,
    val allConfigs: List<TokenAnalysisResult>
)

data class AnalyzerComparisonResult(
    val configA: TokenAnalysisResult,
    val configB: TokenAnalysisResult,
    val sampleTexts: List<String>
)

interface RecommendAnalyzerUseCase {
    fun recommend(domain: String, sampleTexts: List<String>): AnalyzerRecommendation
    fun compare(sampleTexts: List<String>, configNames: List<String>): AnalyzerComparisonResult
    fun analyzeText(query: AnalyzeTextQuery): TokenAnalysisResult
}
