package com.kst.searchtuner.infra.llm.claude

import com.kst.searchtuner.infra.llm.provider.LlmProviderStrategy
import org.springframework.ai.anthropic.AnthropicChatModel
import org.springframework.ai.anthropic.AnthropicChatOptions
import org.springframework.ai.anthropic.api.AnthropicApi
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Component

@Component
class ClaudeProviderStrategy : LlmProviderStrategy {

    override val providerName = "Claude"
    override val priority = 3

    override fun isAvailable(): Boolean = resolveKey()?.isNotBlank() == true

    override fun buildChatClient(): ChatClient {
        val api = AnthropicApi.builder()
            .apiKey(resolveKey()!!)
            .build()

        val options = AnthropicChatOptions.builder()
            .model(resolve("ANTHROPIC_MODEL") ?: "claude-3-5-haiku-20241022")
            .temperature(0.1)
            .build()

        return ChatClient.builder(
            AnthropicChatModel.builder().anthropicApi(api).defaultOptions(options).build()
        ).build()
    }

    private fun resolveKey() = resolve("ANTHROPIC_API_KEY")

    private fun resolve(key: String): String? =
        System.getProperty(key)?.takeIf { it.isNotBlank() }
            ?: System.getenv(key)?.takeIf { it.isNotBlank() }
}
