package com.kst.searchtuner.infra.es.index

import com.kst.searchtuner.core.application.port.`in`.IndexProductUseCase
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig
import com.kst.searchtuner.core.domain.index.IndexJob
import com.kst.searchtuner.core.domain.index.IndexJobStatus
import com.kst.searchtuner.core.domain.index.MigrationJob
import com.kst.searchtuner.core.domain.index.MigrationJobStatus
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.UUID

@Component
class ProductIndexer(
    private val productPersistencePort: ProductPersistencePort,
    private val elasticsearchPort: ElasticsearchPort,
    private val indexJobRegistry: IndexJobRegistry,
    private val migrationJobRegistry: MigrationJobRegistry
) : IndexProductUseCase {

    private val log = LoggerFactory.getLogger(javaClass)
    private val chunkSize = 1_000

    @Volatile
    private var lastSyncAt: LocalDateTime = LocalDateTime.now().minusYears(1)

    override fun startFullIndex(indexName: String): IndexJob {
        val job = IndexJob(id = UUID.randomUUID().toString(), type = "FULL_INDEX")
        indexJobRegistry.register(job)
        Thread { runFullIndex(job.id, indexName) }.start()
        return indexJobRegistry.get(job.id) ?: job
    }

    override fun startIncrementalSync(indexName: String): IndexJob {
        val job = IndexJob(id = UUID.randomUUID().toString(), type = "INCREMENTAL_SYNC")
        indexJobRegistry.register(job)
        Thread { runIncrementalSync(job.id, indexName) }.start()
        return indexJobRegistry.get(job.id) ?: job
    }

    override fun getJob(jobId: String): IndexJob? = indexJobRegistry.get(jobId)

    override fun startMigration(alias: String, newAnalyzerConfig: String?): MigrationJob {
        val newIndex = "$alias-${System.currentTimeMillis()}"
        val job = MigrationJob(
            id = UUID.randomUUID().toString(),
            oldIndex = alias,
            newIndex = newIndex,
            alias = alias
        )
        migrationJobRegistry.register(job)
        Thread { runMigration(job.id, alias, alias, newIndex) }.start()
        return migrationJobRegistry.get(job.id) ?: job
    }

    override fun getMigration(migrationId: String): MigrationJob? = migrationJobRegistry.get(migrationId)

    override fun rollbackMigration(migrationId: String): MigrationJob {
        val job = migrationJobRegistry.get(migrationId)
            ?: error("Migration $migrationId not found")
        if (elasticsearchPort.indexExists(job.newIndex)) {
            elasticsearchPort.switchAlias(job.alias, job.newIndex, job.oldIndex)
            elasticsearchPort.deleteIndex(job.newIndex)
        }
        migrationJobRegistry.rollback(migrationId)
        return migrationJobRegistry.get(migrationId) ?: job.copy(status = MigrationJobStatus.ROLLED_BACK)
    }

    private fun runFullIndex(jobId: String, indexName: String) {
        try {
            val total = productPersistencePort.countAll()
            indexJobRegistry.updateProgress(jobId, 0, total)
            var page = 0
            var indexed = 0L
            while (true) {
                val products = productPersistencePort.findAll(page, chunkSize)
                if (products.isEmpty()) break
                elasticsearchPort.bulkIndex(indexName, products)
                indexed += products.size
                indexJobRegistry.updateProgress(jobId, indexed, total)
                log.info("Full index progress: $indexed / $total")
                page++
            }
            indexJobRegistry.complete(jobId)
            log.info("Full index completed: $indexed documents")
        } catch (ex: Exception) {
            log.error("Full index failed", ex)
            indexJobRegistry.fail(jobId, ex.message ?: "Unknown error")
        }
    }

    private fun runIncrementalSync(jobId: String, indexName: String) {
        try {
            val syncFrom = lastSyncAt
            val now = LocalDateTime.now()
            var page = 0
            var indexed = 0L
            while (true) {
                val products = productPersistencePort.findUpdatedAfter(syncFrom, page, chunkSize)
                if (products.isEmpty()) break
                elasticsearchPort.bulkIndex(indexName, products)
                indexed += products.size
                indexJobRegistry.updateProgress(jobId, indexed, indexed)
                page++
            }
            lastSyncAt = now
            indexJobRegistry.complete(jobId)
            log.info("Incremental sync completed: $indexed documents updated since $syncFrom")
        } catch (ex: Exception) {
            log.error("Incremental sync failed", ex)
            indexJobRegistry.fail(jobId, ex.message ?: "Unknown error")
        }
    }

    private fun runMigration(migrationId: String, alias: String, oldIndex: String, newIndex: String) {
        try {
            elasticsearchPort.createIndex(newIndex, AnalyzerConfig("korean_search"))
            migrationJobRegistry.updateStatus(migrationId, MigrationJobStatus.INDEXING)
            val total = productPersistencePort.countAll()
            migrationJobRegistry.updateProgress(migrationId, 0, total)
            var page = 0
            var indexed = 0L
            while (true) {
                val products = productPersistencePort.findAll(page, chunkSize)
                if (products.isEmpty()) break
                elasticsearchPort.bulkIndex(newIndex, products)
                indexed += products.size
                migrationJobRegistry.updateProgress(migrationId, indexed, total)
                page++
            }
            migrationJobRegistry.updateStatus(migrationId, MigrationJobStatus.SWITCHING)
            elasticsearchPort.switchAlias(alias, oldIndex, newIndex)
            migrationJobRegistry.complete(migrationId)
            log.info("Blue-Green migration completed: alias $alias → $newIndex")
        } catch (ex: Exception) {
            log.error("Migration failed", ex)
            migrationJobRegistry.fail(migrationId, ex.message ?: "Unknown error")
        }
    }
}
