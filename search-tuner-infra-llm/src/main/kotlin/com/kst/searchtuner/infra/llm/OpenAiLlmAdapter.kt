package com.kst.searchtuner.infra.llm

import com.kst.searchtuner.core.application.port.out.AnalyzerRecommendationSuggestion
import com.kst.searchtuner.core.application.port.out.LlmPort
import com.kst.searchtuner.core.application.port.out.RelevanceJudgement
import com.kst.searchtuner.core.application.port.out.SynonymSuggestion
import com.kst.searchtuner.infra.llm.prompt.AnalyzerPromptTemplate
import com.kst.searchtuner.infra.llm.prompt.RelevancePromptTemplate
import com.kst.searchtuner.infra.llm.prompt.SynonymPromptTemplate
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Component

@Component
class LlmAdapter(
    private val chatClient: ChatClient
) : LlmPort {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun suggestSynonyms(category: String, productNames: List<String>): List<SynonymSuggestion> {
        val userMessage = SynonymPromptTemplate.user(category, productNames)
        return retryOnce {
            val raw = callLlm(SynonymPromptTemplate.system, userMessage)
            val response = LlmResponseParser.parse<SynonymResponse>(raw)
            response.synonymGroups.map { group ->
                SynonymSuggestion(
                    terms = group.terms,
                    type = group.type,
                    confidence = group.confidence,
                    reasoning = group.reasoning
                )
            }
        } ?: emptyList()
    }

    override fun recommendAnalyzer(
        domain: String,
        sampleTexts: List<String>,
        tokenizationResults: Map<String, List<String>>
    ): AnalyzerRecommendationSuggestion {
        val userMessage = AnalyzerPromptTemplate.user(domain, sampleTexts, tokenizationResults)
        return retryOnce {
            val raw = callLlm(AnalyzerPromptTemplate.system, userMessage)
            LlmResponseParser.parse<AnalyzerRecommendationSuggestion>(raw)
        } ?: AnalyzerRecommendationSuggestion(
            recommendation = "config_c_mixed",
            reasoning = "LLM call failed, defaulting to mixed decompound mode",
            tradeoffs = "May over-segment compound nouns"
        )
    }

    override fun judgeRelevance(
        query: String,
        productName: String,
        category: String,
        brand: String?,
        description: String?
    ): RelevanceJudgement {
        val userMessage = RelevancePromptTemplate.user(query, productName, category, brand, description)
        return retryOnce {
            val raw = callLlm(RelevancePromptTemplate.system, userMessage)
            LlmResponseParser.parse<RelevanceJudgement>(raw)
        } ?: RelevanceJudgement(score = 0, reasoning = "LLM call failed")
    }

    private fun callLlm(systemPrompt: String, userMessage: String): String =
        chatClient.prompt()
            .system(systemPrompt)
            .user(userMessage)
            .call()
            .content() ?: ""

    private fun <T> retryOnce(block: () -> T): T? {
        return try {
            block()
        } catch (ex: Exception) {
            log.warn("LLM call failed, retrying once: ${ex.message}")
            try {
                block()
            } catch (retryEx: Exception) {
                log.error("LLM retry also failed, skipping batch: ${retryEx.message}")
                null
            }
        }
    }

    // Internal response DTOs for JSON parsing
    private data class SynonymResponse(val synonymGroups: List<SynonymGroupDto>)
    private data class SynonymGroupDto(
        val terms: List<String>,
        val type: String,
        val confidence: Double,
        val reasoning: String
    )
}
