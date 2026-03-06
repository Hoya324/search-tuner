package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.application.port.`in`.AnalyzerComparisonResult
import com.kst.searchtuner.core.application.port.`in`.AnalyzerRecommendation
import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig

data class AnalyzerConfigResponse(
    val name: String,
    val decompoundMode: String,
    val posFilter: List<String>,
    val useSynonymFilter: Boolean
) {
    companion object {
        fun from(config: AnalyzerConfig) = AnalyzerConfigResponse(
            name = config.name,
            decompoundMode = config.decompoundMode.name,
            posFilter = config.posFilter,
            useSynonymFilter = config.useSynonymFilter
        )
    }
}

data class AnalyzerRecommendationResponse(
    val recommendedConfig: AnalyzerConfigResponse,
    val reasoning: String,
    val tradeoffs: String,
    val comparedConfigs: List<TokenAnalysisResult>
) {
    data class TokenAnalysisResult(val configName: String, val tokens: List<String>)

    companion object {
        fun from(recommendation: AnalyzerRecommendation) = AnalyzerRecommendationResponse(
            recommendedConfig = AnalyzerConfigResponse.from(recommendation.recommendedConfig),
            reasoning = recommendation.reasoning,
            tradeoffs = recommendation.tradeoffs,
            comparedConfigs = recommendation.allConfigs.map {
                TokenAnalysisResult(it.config.name, it.tokens)
            }
        )
    }
}

data class AnalyzerComparisonResponse(
    val configA: AnalyzerConfigResponse,
    val configATokens: List<String>,
    val configB: AnalyzerConfigResponse,
    val configBTokens: List<String>,
    val sampleTexts: List<String>
) {
    companion object {
        fun from(result: AnalyzerComparisonResult) = AnalyzerComparisonResponse(
            configA = AnalyzerConfigResponse.from(result.configA.config),
            configATokens = result.configA.tokens,
            configB = AnalyzerConfigResponse.from(result.configB.config),
            configBTokens = result.configB.tokens,
            sampleTexts = result.sampleTexts
        )
    }
}
