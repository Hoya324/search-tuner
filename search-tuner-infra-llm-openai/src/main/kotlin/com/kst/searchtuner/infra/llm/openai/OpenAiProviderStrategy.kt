package com.kst.searchtuner.infra.llm.openai

import com.kst.searchtuner.infra.llm.provider.LlmProviderStrategy
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.stereotype.Component

@Component
class OpenAiProviderStrategy : LlmProviderStrategy {

    override val providerName = "OpenAI"
    override val priority = 1

    override fun isAvailable(): Boolean = resolveKey()?.isNotBlank() == true

    override fun buildChatClient(): ChatClient {
        val api = OpenAiApi.builder()
            .baseUrl("https://api.openai.com")
            .apiKey(resolveKey()!!)
            .build()

        val options = OpenAiChatOptions.builder()
            .model(resolve("OPENAI_MODEL") ?: "gpt-4o-mini")
            .temperature(0.1)
            .build()

        return ChatClient.builder(
            OpenAiChatModel.builder().openAiApi(api).defaultOptions(options).build()
        ).build()
    }

    private fun resolveKey() = resolve("OPENAI_API_KEY")

    private fun resolve(key: String): String? =
        System.getProperty(key)?.takeIf { it.isNotBlank() }
            ?: System.getenv(key)?.takeIf { it.isNotBlank() }
}
