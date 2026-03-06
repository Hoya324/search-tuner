package com.kst.searchtuner.core.application.service

import com.kst.searchtuner.core.application.port.`in`.AnalyzeTextQuery
import com.kst.searchtuner.core.application.port.`in`.AnalyzerComparisonResult
import com.kst.searchtuner.core.application.port.`in`.AnalyzerRecommendation
import com.kst.searchtuner.core.application.port.`in`.RecommendAnalyzerUseCase
import com.kst.searchtuner.core.application.port.`in`.TokenAnalysisResult
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.LlmPort
import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig
import com.kst.searchtuner.core.domain.analyzer.DecompoundMode

class AnalyzerRecommendationService(
    private val elasticsearchPort: ElasticsearchPort,
    private val llmPort: LlmPort
) : RecommendAnalyzerUseCase {

    private val presetConfigs = listOf(
        AnalyzerConfig("config_a_none", DecompoundMode.NONE),
        AnalyzerConfig("config_b_discard", DecompoundMode.DISCARD),
        AnalyzerConfig("config_c_mixed", DecompoundMode.MIXED)
    )

    override fun recommend(domain: String, sampleTexts: List<String>): AnalyzerRecommendation {
        val tokenizationResults = presetConfigs.associate { config ->
            config.name to sampleTexts.flatMap { text ->
                elasticsearchPort.analyzeText(text, "products", "korean_${config.decompoundMode.name.lowercase()}")
            }
        }

        val allResults = presetConfigs.map { config ->
            TokenAnalysisResult(config, tokenizationResults[config.name] ?: emptyList())
        }

        val suggestion = llmPort.recommendAnalyzer(domain, sampleTexts, tokenizationResults)
        val recommended = presetConfigs.find { it.name == suggestion.recommendation } ?: presetConfigs[2]

        return AnalyzerRecommendation(
            recommendedConfig = recommended,
            reasoning = suggestion.reasoning,
            tradeoffs = suggestion.tradeoffs,
            allConfigs = allResults
        )
    }

    override fun compare(sampleTexts: List<String>, configNames: List<String>): AnalyzerComparisonResult {
        val configA = presetConfigs.find { it.name == configNames.getOrNull(0) } ?: presetConfigs[0]
        val configB = presetConfigs.find { it.name == configNames.getOrNull(1) } ?: presetConfigs[1]

        val tokensA = sampleTexts.flatMap { elasticsearchPort.analyzeText(it, "products", "korean_${configA.decompoundMode.name.lowercase()}") }
        val tokensB = sampleTexts.flatMap { elasticsearchPort.analyzeText(it, "products", "korean_${configB.decompoundMode.name.lowercase()}") }

        return AnalyzerComparisonResult(
            configA = TokenAnalysisResult(configA, tokensA),
            configB = TokenAnalysisResult(configB, tokensB),
            sampleTexts = sampleTexts
        )
    }

    override fun analyzeText(query: AnalyzeTextQuery): TokenAnalysisResult {
        val tokens = elasticsearchPort.analyzeText(query.text, query.indexName, query.analyzerName)
        val config = presetConfigs.find { "korean_${it.decompoundMode.name.lowercase()}" == query.analyzerName }
            ?: AnalyzerConfig(query.analyzerName)
        return TokenAnalysisResult(config, tokens)
    }
}
