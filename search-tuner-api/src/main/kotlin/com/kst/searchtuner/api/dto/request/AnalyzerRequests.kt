package com.kst.searchtuner.api.dto.request

data class RecommendAnalyzerRequest(
    val domain: String,
    val sampleTexts: List<String>
)

data class CompareAnalyzerRequest(
    val sampleTexts: List<String>,
    val configNames: List<String> = listOf("config_a_none", "config_b_discard")
)
