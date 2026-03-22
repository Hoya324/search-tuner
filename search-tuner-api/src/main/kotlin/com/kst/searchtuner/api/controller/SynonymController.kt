package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.request.ApplyStrategy
import com.kst.searchtuner.api.dto.request.ApplySynonymRequest
import com.kst.searchtuner.api.dto.request.GenerateFromProductRequest
import com.kst.searchtuner.api.dto.request.GenerateSynonymRequest
import com.kst.searchtuner.api.dto.request.SuggestForProductRequest
import com.kst.searchtuner.api.dto.request.UpdateSynonymGroupRequest
import com.kst.searchtuner.api.dto.response.SynonymApplicationResponse
import com.kst.searchtuner.api.dto.response.SynonymSetResponse
import com.kst.searchtuner.core.application.port.`in`.GenerateSynonymCommand
import com.kst.searchtuner.core.application.port.`in`.GenerateSynonymUseCase
import com.kst.searchtuner.core.application.port.`in`.IndexProductUseCase
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.SynonymPersistencePort
import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/synonyms")
@Tag(name = "Synonyms", description = "AI-powered synonym generation and management")
class SynonymController(
    private val generateSynonymUseCase: GenerateSynonymUseCase,
    private val synonymPersistencePort: SynonymPersistencePort,
    private val elasticsearchPort: ElasticsearchPort,
    private val indexProductUseCase: IndexProductUseCase
) {

    @PostMapping("/generate")
    @Operation(summary = "Generate synonyms using LLM from product data")
    fun generate(@RequestBody request: GenerateSynonymRequest): SynonymSetResponse {
        val synonymSet = generateSynonymUseCase.generate(
            GenerateSynonymCommand(
                name = request.name,
                category = request.category,
                confidenceThreshold = request.confidenceThreshold,
                batchSize = request.batchSize
            )
        )
        return SynonymSetResponse.from(synonymSet)
    }

    @GetMapping
    @Operation(summary = "List all synonym sets")
    fun listAll(): List<SynonymSetResponse> =
        generateSynonymUseCase.listAll().map { SynonymSetResponse.from(it) }

    @GetMapping("/{id}")
    @Operation(summary = "Get a synonym set by ID")
    fun getById(@PathVariable id: Long): ResponseEntity<SynonymSetResponse> {
        val synonymSet = generateSynonymUseCase.getById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(SynonymSetResponse.from(synonymSet))
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download synonym set as Elasticsearch-compatible text file")
    fun download(@PathVariable id: Long): ResponseEntity<String> {
        val synonymSet = generateSynonymUseCase.getById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=synonyms_${id}.txt")
            .contentType(MediaType.TEXT_PLAIN)
            .body(synonymSet.toSynonymFileContent())
    }

    @PostMapping("/{id}/apply")
    @Operation(summary = "Apply synonym set to Elasticsearch (RELOAD or BLUE_GREEN)")
    fun apply(@PathVariable id: Long, @RequestBody request: ApplySynonymRequest): ResponseEntity<SynonymApplicationResponse> {
        val synonymSet = generateSynonymUseCase.getById(id)
            ?: return ResponseEntity.notFound().build()

        return try {
            val synonymContent = synonymSet.toSynonymFileContent()

            when (request.strategy) {
                ApplyStrategy.RELOAD -> {
                    elasticsearchPort.updateSynonyms(request.indexName, synonymContent)
                }
                ApplyStrategy.BLUE_GREEN -> {
                    indexProductUseCase.startMigration(request.indexName, null)
                }
            }

            val approved = synonymSet.approve()
            synonymPersistencePort.save(approved)

            ResponseEntity.ok(SynonymApplicationResponse(
                synonymSetId = id,
                strategy = request.strategy.name,
                indexName = request.indexName,
                appliedGroupCount = synonymSet.groups.size,
                synonymContent = synonymContent
            ))
        } catch (e: Exception) {
            ResponseEntity.internalServerError().build()
        }
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Preview synonym file content without applying")
    fun preview(@PathVariable id: Long): ResponseEntity<String> {
        val synonymSet = generateSynonymUseCase.getById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_PLAIN)
            .body(synonymSet.toSynonymFileContent())
    }

    @PostMapping("/generate/from-product")
    @Operation(summary = "Generate synonyms from a specific product name")
    fun generateFromProduct(@RequestBody request: GenerateFromProductRequest): SynonymSetResponse {
        val synonymSet = generateSynonymUseCase.generateFromProduct(request.productName, request.excludeExisting)
        return SynonymSetResponse.from(synonymSet)
    }

    @PostMapping("/suggest-for-product")
    @Operation(summary = "Suggest synonyms for a product name")
    fun suggestForProduct(@RequestBody request: SuggestForProductRequest): Map<String, Any> {
        val result = generateSynonymUseCase.suggestForProduct(request.productName, request.category)
        return mapOf(
            "existingGroups" to result.existingGroups.map { (id, terms) -> mapOf("groupId" to id, "terms" to terms) },
            "suggestedNewTerms" to result.suggestedNewTerms
        )
    }

    @PatchMapping("/{id}/groups/{groupId}/terms")
    @Operation(summary = "Add terms to an existing synonym group")
    fun addTermsToGroup(
        @PathVariable id: Long,
        @PathVariable groupId: String,
        @RequestBody body: Map<String, List<String>>
    ): ResponseEntity<SynonymSetResponse> {
        val synonymSet = generateSynonymUseCase.getById(id) ?: return ResponseEntity.notFound().build()
        val addTerms = body["addTerms"] ?: return ResponseEntity.badRequest().build()
        val group = synonymSet.groups.find { it.id == groupId } ?: return ResponseEntity.notFound().build()
        val updatedGroup = group.copy(terms = (group.terms + addTerms).distinct())
        val updatedSet = generateSynonymUseCase.updateGroup(id, groupId, updatedGroup)
        return ResponseEntity.ok(SynonymSetResponse.from(updatedSet))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a synonym set by ID")
    fun delete(@PathVariable id: Long): Map<String, Boolean> {
        synonymPersistencePort.delete(id)
        return mapOf("success" to true)
    }

    @PatchMapping("/{id}/groups/{groupId}")
    @Operation(summary = "Update a synonym group within a synonym set")
    fun updateGroup(
        @PathVariable id: Long,
        @PathVariable groupId: String,
        @RequestBody request: UpdateSynonymGroupRequest
    ): SynonymSetResponse {
        val updated = SynonymGroup(
            id = groupId,
            terms = request.terms,
            type = request.type,
            confidence = request.confidence,
            reasoning = request.reasoning
        )
        return SynonymSetResponse.from(generateSynonymUseCase.updateGroup(id, groupId, updated))
    }
}
