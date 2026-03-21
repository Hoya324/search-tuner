package com.kst.searchtuner.infra.llm.config

import com.kst.searchtuner.infra.llm.provider.LlmProviderStrategy
import org.slf4j.LoggerFactory
import org.springframework.ai.chat.client.ChatClient
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class LlmConfig(
    private val strategies: List<LlmProviderStrategy>
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Bean
    fun chatClient(): ChatClient {
        val strategy = strategies
            .filter { it.isAvailable() }
            .maxByOrNull { it.priority }
            ?: throw IllegalStateException(
                "No LLM provider configured. Set one of: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY"
            )

        log.info("LLM provider selected: ${strategy.providerName}")
        return strategy.buildChatClient()
    }
}
