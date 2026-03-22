package com.kst.searchtuner.core.application.port.`in`

import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import com.kst.searchtuner.core.domain.synonym.SynonymSet

data class GenerateSynonymCommand(
    val category: String? = null,
    val name: String,
    val confidenceThreshold: Double = 0.7,
    val batchSize: Int = 500
)

data class ProductSuggestionResult(
    val existingGroups: List<Pair<Long, List<String>>>,
    val suggestedNewTerms: List<String>
)

interface GenerateSynonymUseCase {
    fun generate(command: GenerateSynonymCommand): SynonymSet
    fun getById(id: Long): SynonymSet?
    fun updateGroup(synonymSetId: Long, groupId: String, updated: SynonymGroup): SynonymSet
    fun listAll(): List<SynonymSet>
    fun generateFromProduct(productName: String, excludeExisting: Boolean): SynonymSet
    fun suggestForProduct(productName: String, category: String?): ProductSuggestionResult
}
