package com.kst.searchtuner.api.dto.request

import com.kst.searchtuner.core.domain.synonym.SynonymType

data class GenerateSynonymRequest(
    val name: String,
    val category: String? = null,
    val confidenceThreshold: Double = 0.7,
    val batchSize: Int = 500
)

data class ApplySynonymRequest(
    val strategy: ApplyStrategy = ApplyStrategy.RELOAD,
    val indexName: String = "products",
    val sourceIndex: String? = null
)

enum class ApplyStrategy { RELOAD, BLUE_GREEN }

data class UpdateSynonymGroupRequest(
    val terms: List<String>,
    val type: SynonymType,
    val confidence: Double,
    val reasoning: String? = null
)
