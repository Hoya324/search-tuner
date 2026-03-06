package com.kst.searchtuner.core.domain.analyzer

enum class DecompoundMode { NONE, DISCARD, MIXED }

data class AnalyzerConfig(
    val name: String,
    val decompoundMode: DecompoundMode = DecompoundMode.MIXED,
    val posFilter: List<String> = listOf("E", "IC", "J", "MAG", "MM", "SP", "SSC", "SSO", "SC", "SE", "XPN", "XSA", "UNA", "NA", "VSV"),
    val useSynonymFilter: Boolean = false
)
