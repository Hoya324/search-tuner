package com.kst.searchtuner.core.application.port.`in`

import com.kst.searchtuner.core.domain.index.IndexJob
import com.kst.searchtuner.core.domain.index.MigrationJob

interface IndexProductUseCase {
    fun startFullIndex(indexName: String): IndexJob
    fun startIncrementalSync(indexName: String): IndexJob
    fun getJob(jobId: String): IndexJob?
    fun startMigration(alias: String, newAnalyzerConfig: String?): MigrationJob
    fun getMigration(migrationId: String): MigrationJob?
    fun rollbackMigration(migrationId: String): MigrationJob
}
