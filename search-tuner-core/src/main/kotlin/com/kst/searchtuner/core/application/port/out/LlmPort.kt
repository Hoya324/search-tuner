package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig
import com.kst.searchtuner.core.domain.synonym.SynonymGroup

data class SynonymSuggestion(
    val terms: List<String>,
    val type: String,
    val confidence: Double,
    val reasoning: String
)

data class AnalyzerRecommendationSuggestion(
    val recommendation: String,
    val reasoning: String,
    val tradeoffs: String
)

data class RelevanceJudgement(
    val score: Int,
    val reasoning: String
)

interface LlmPort {
    fun suggestSynonyms(category: String, productNames: List<String>): List<SynonymSuggestion>
    fun recommendAnalyzer(
        domain: String,
        sampleTexts: List<String>,
        tokenizationResults: Map<String, List<String>>
    ): AnalyzerRecommendationSuggestion

    fun judgeRelevance(
        query: String,
        productName: String,
        category: String,
        brand: String?,
        description: String?
    ): RelevanceJudgement
}
