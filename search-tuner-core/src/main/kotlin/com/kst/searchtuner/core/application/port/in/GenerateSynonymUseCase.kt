package com.kst.searchtuner.core.application.port.`in`

import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import com.kst.searchtuner.core.domain.synonym.SynonymSet

data class GenerateSynonymCommand(
    val category: String? = null,
    val name: String,
    val confidenceThreshold: Double = 0.7,
    val batchSize: Int = 500
)

interface GenerateSynonymUseCase {
    fun generate(command: GenerateSynonymCommand): SynonymSet
    fun getById(id: Long): SynonymSet?
    fun updateGroup(synonymSetId: Long, groupId: String, updated: SynonymGroup): SynonymSet
    fun listAll(): List<SynonymSet>
}
