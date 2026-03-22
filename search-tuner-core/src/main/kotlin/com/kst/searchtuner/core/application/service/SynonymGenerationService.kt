package com.kst.searchtuner.core.application.service

import com.kst.searchtuner.core.application.port.`in`.GenerateSynonymCommand
import com.kst.searchtuner.core.application.port.`in`.GenerateSynonymUseCase
import com.kst.searchtuner.core.application.port.`in`.ProductSuggestionResult
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.LlmPort
import com.kst.searchtuner.core.application.port.out.SynonymPersistencePort
import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import com.kst.searchtuner.core.domain.synonym.SynonymSet
import com.kst.searchtuner.core.domain.synonym.SynonymType
import java.util.UUID

class SynonymGenerationService(
    private val llmPort: LlmPort,
    private val elasticsearchPort: ElasticsearchPort,
    private val synonymPersistencePort: SynonymPersistencePort
) : GenerateSynonymUseCase {

    override fun generate(command: GenerateSynonymCommand): SynonymSet {
        val category = command.category ?: "general"
        val productNames = elasticsearchPort.sampleFieldValues(
            indexName = "products",
            field = "product_name.keyword",
            size = command.batchSize
        )

        val groups = productNames
            .chunked(command.batchSize)
            .flatMap { batch ->
                llmPort.suggestSynonyms(category, batch)
                    .filter { it.confidence >= command.confidenceThreshold }
            }
            .map { suggestion ->
                SynonymGroup(
                    id = UUID.randomUUID().toString(),
                    terms = suggestion.terms,
                    type = SynonymType.valueOf(suggestion.type),
                    confidence = suggestion.confidence,
                    reasoning = suggestion.reasoning
                )
            }

        val merged = mergeOverlappingGroups(groups)

        val synonymSet = SynonymSet(
            name = command.name,
            groups = merged
        )
        return synonymPersistencePort.save(synonymSet)
    }

    override fun getById(id: Long): SynonymSet? = synonymPersistencePort.findById(id)

    override fun updateGroup(synonymSetId: Long, groupId: String, updated: SynonymGroup): SynonymSet {
        val synonymSet = synonymPersistencePort.findById(synonymSetId)
            ?: error("SynonymSet $synonymSetId not found")
        val updatedSet = synonymSet.updateGroup(groupId, updated)
        return synonymPersistencePort.save(updatedSet)
    }

    override fun listAll(): List<SynonymSet> = synonymPersistencePort.findAll()

    override fun generateFromProduct(productName: String, excludeExisting: Boolean): SynonymSet {
        val existingTerms = if (excludeExisting) {
            synonymPersistencePort.findAll()
                .flatMap { it.groups }
                .flatMap { it.terms }
                .toSet()
        } else emptySet()

        val relatedNames = elasticsearchPort.sampleFieldValues(
            indexName = "products",
            field = "product_name.keyword",
            size = 50
        ).filter { it.contains(productName, ignoreCase = true) || productName.contains(it, ignoreCase = true) }
            .ifEmpty { listOf(productName) }

        val groups = llmPort.suggestSynonyms(productName, relatedNames)
            .filter { suggestion -> suggestion.terms.any { it !in existingTerms } }
            .map { suggestion ->
                SynonymGroup(
                    id = UUID.randomUUID().toString(),
                    terms = suggestion.terms,
                    type = SynonymType.valueOf(suggestion.type),
                    confidence = suggestion.confidence,
                    reasoning = suggestion.reasoning
                )
            }

        val synonymSet = SynonymSet(
            name = "상품명 기반: $productName",
            groups = groups
        )
        return synonymPersistencePort.save(synonymSet)
    }

    override fun suggestForProduct(productName: String, category: String?): ProductSuggestionResult {
        val allSets = synonymPersistencePort.findAll()

        val existingGroups = allSets.flatMap { set ->
            set.groups.mapIndexed { idx, group ->
                Pair(set.id * 10000L + idx, group.terms)
            }
        }.filter { (_, terms) ->
            terms.any { term ->
                productName.contains(term, ignoreCase = true) || term.contains(productName, ignoreCase = true)
            }
        }

        val suggestedNewTerms = if (existingGroups.isEmpty()) {
            try {
                llmPort.suggestSynonyms(category ?: productName, listOf(productName))
                    .take(3)
                    .flatMap { it.terms }
                    .distinct()
            } catch (e: Exception) {
                emptyList()
            }
        } else emptyList()

        return ProductSuggestionResult(existingGroups, suggestedNewTerms)
    }

    /**
     * Merges synonym groups that share common terms to avoid contradictions.
     */
    private fun mergeOverlappingGroups(groups: List<SynonymGroup>): List<SynonymGroup> {
        val result = mutableListOf<SynonymGroup>()
        val processed = BooleanArray(groups.size)

        for (i in groups.indices) {
            if (processed[i]) continue
            var merged = groups[i]
            for (j in (i + 1) until groups.size) {
                if (processed[j]) continue
                if (groups[j].terms.any { it in merged.terms }) {
                    val combinedTerms = (merged.terms + groups[j].terms).distinct()
                    merged = merged.copy(
                        terms = combinedTerms,
                        confidence = minOf(merged.confidence, groups[j].confidence)
                    )
                    processed[j] = true
                }
            }
            result.add(merged)
        }
        return result
    }
}
