package com.kst.searchtuner.infra.llm.provider

import org.springframework.ai.chat.client.ChatClient

/**
 * Strategy interface for LLM provider selection.
 * Each provider module registers one implementation as a Spring @Component.
 * LlmConfig picks the available provider with the highest [priority].
 *
 * Priority convention: Claude(3) > Gemini(2) > OpenAI(1)
 * Provider is active only when [isAvailable] returns true (API key present).
 */
interface LlmProviderStrategy {
    val providerName: String
    val priority: Int
    fun isAvailable(): Boolean
    fun buildChatClient(): ChatClient
}
