package com.kst.searchtuner.infra.llm

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

object LlmResponseParser {

    @PublishedApi
    internal val objectMapper = jacksonObjectMapper()

    /**
     * Strips markdown code fences and parses JSON.
     */
    fun <T> parse(raw: String, clazz: Class<T>): T {
        val cleaned = stripMarkdownCodeFence(raw)
        return objectMapper.readValue(cleaned, clazz)
    }

    inline fun <reified T> parse(raw: String): T {
        val cleaned = raw.trim().let { trimmed ->
            when {
                trimmed.startsWith("```json") -> trimmed.removePrefix("```json").removeSuffix("```").trim()
                trimmed.startsWith("```") -> trimmed.removePrefix("```").removeSuffix("```").trim()
                else -> trimmed
            }
        }
        return objectMapper.readValue(cleaned)
    }

    private fun stripMarkdownCodeFence(raw: String): String {
        val trimmed = raw.trim()
        return when {
            trimmed.startsWith("```json") -> trimmed.removePrefix("```json").removeSuffix("```").trim()
            trimmed.startsWith("```") -> trimmed.removePrefix("```").removeSuffix("```").trim()
            else -> trimmed
        }
    }
}
