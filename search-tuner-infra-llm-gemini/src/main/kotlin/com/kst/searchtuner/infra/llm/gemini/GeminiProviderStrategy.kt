package com.kst.searchtuner.infra.llm.gemini

import com.kst.searchtuner.infra.llm.provider.LlmProviderStrategy
import org.springframework.ai.chat.client.ChatClient
import org.springframework.ai.openai.OpenAiChatModel
import org.springframework.ai.openai.OpenAiChatOptions
import org.springframework.ai.openai.api.OpenAiApi
import org.springframework.stereotype.Component

@Component
class GeminiProviderStrategy : LlmProviderStrategy {

    override val providerName = "Gemini"
    override val priority = 2

    override fun isAvailable(): Boolean = resolveKey()?.isNotBlank() == true

    override fun buildChatClient(): ChatClient {
        val api = OpenAiApi.builder()
            .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai")
            .apiKey(resolveKey()!!)
            .build()

        val options = OpenAiChatOptions.builder()
            .model(resolve("GEMINI_MODEL") ?: "gemini-2.5-flash-lite")
            .temperature(0.1)
            .build()

        return ChatClient.builder(
            OpenAiChatModel.builder().openAiApi(api).defaultOptions(options).build()
        ).build()
    }

    private fun resolveKey() = resolve("GEMINI_API_KEY")

    private fun resolve(key: String): String? =
        System.getProperty(key)?.takeIf { it.isNotBlank() }
            ?: System.getenv(key)?.takeIf { it.isNotBlank() }
}
