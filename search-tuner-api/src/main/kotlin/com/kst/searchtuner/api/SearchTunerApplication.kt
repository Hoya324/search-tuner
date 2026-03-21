package com.kst.searchtuner.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import java.io.File

@SpringBootApplication(
    excludeName = [
        "org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration",
        "org.springframework.ai.autoconfigure.anthropic.AnthropicAutoConfiguration",
    ],
    scanBasePackages = [
        "com.kst.searchtuner.api",
        "com.kst.searchtuner.infra.persistence",
        "com.kst.searchtuner.infra.es",
        "com.kst.searchtuner.infra.llm"
    ]
)
class SearchTunerApplication

fun main(args: Array<String>) {
    loadDotEnv()
    runApplication<SearchTunerApplication>(*args)
}

private fun loadDotEnv() {
    val envFile = File(".env")
    if (!envFile.exists()) return
    envFile.readLines()
        .filter { it.isNotBlank() && !it.startsWith("#") && it.contains("=") }
        .forEach { line ->
            val idx = line.indexOf('=')
            val key = line.substring(0, idx).trim()
            val value = line.substring(idx + 1).trim()
            if (System.getenv(key) == null) System.setProperty(key, value)
        }
}
