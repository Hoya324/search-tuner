package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.response.IndexJobResponse
import com.kst.searchtuner.api.dto.response.MigrationJobResponse
import com.kst.searchtuner.core.application.port.`in`.IndexProductUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/index")
@Tag(name = "Index", description = "Elasticsearch indexing and migration operations")
class IndexController(
    private val indexProductUseCase: IndexProductUseCase
) {

    @PostMapping("/full")
    @Operation(summary = "Start full reindex from MySQL to Elasticsearch")
    fun startFullIndex(
        @RequestParam(defaultValue = "products") indexName: String
    ): IndexJobResponse =
        IndexJobResponse.from(indexProductUseCase.startFullIndex(indexName))

    @PostMapping("/sync")
    @Operation(summary = "Start incremental sync for recently updated products")
    fun startIncrementalSync(
        @RequestParam(defaultValue = "products") indexName: String
    ): IndexJobResponse =
        IndexJobResponse.from(indexProductUseCase.startIncrementalSync(indexName))

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Get index job status")
    fun getJob(@PathVariable jobId: String): ResponseEntity<IndexJobResponse> {
        val job = indexProductUseCase.getJob(jobId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(IndexJobResponse.from(job))
    }

    @PostMapping("/migrate")
    @Operation(summary = "Start Blue-Green migration to a new index")
    fun startMigration(
        @RequestParam(defaultValue = "products") alias: String,
        @RequestParam(required = false) analyzerConfig: String?
    ): MigrationJobResponse =
        MigrationJobResponse.from(indexProductUseCase.startMigration(alias, analyzerConfig))

    @GetMapping("/migrate/{migrationId}")
    @Operation(summary = "Get migration job status")
    fun getMigration(@PathVariable migrationId: String): ResponseEntity<MigrationJobResponse> {
        val job = indexProductUseCase.getMigration(migrationId) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(MigrationJobResponse.from(job))
    }

    @PostMapping("/migrate/{migrationId}/rollback")
    @Operation(summary = "Rollback a migration and restore the old index")
    fun rollbackMigration(@PathVariable migrationId: String): MigrationJobResponse =
        MigrationJobResponse.from(indexProductUseCase.rollbackMigration(migrationId))
}
