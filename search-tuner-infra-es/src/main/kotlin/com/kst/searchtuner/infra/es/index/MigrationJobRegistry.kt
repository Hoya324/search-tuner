package com.kst.searchtuner.infra.es.index

import com.kst.searchtuner.core.domain.index.MigrationJob
import com.kst.searchtuner.core.domain.index.MigrationJobStatus
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Component
class MigrationJobRegistry {
    private val jobs = ConcurrentHashMap<String, MigrationJob>()

    fun register(job: MigrationJob): MigrationJob {
        jobs[job.id] = job
        return job
    }

    fun get(migrationId: String): MigrationJob? = jobs[migrationId]

    fun updateStatus(migrationId: String, status: MigrationJobStatus) {
        jobs.computeIfPresent(migrationId) { _, job -> job.copy(status = status) }
    }

    fun updateProgress(migrationId: String, indexed: Long, total: Long) {
        jobs.computeIfPresent(migrationId) { _, job ->
            job.copy(indexed = indexed, total = total, status = MigrationJobStatus.INDEXING)
        }
    }

    fun complete(migrationId: String) {
        jobs.computeIfPresent(migrationId) { _, job ->
            job.copy(status = MigrationJobStatus.COMPLETED, completedAt = LocalDateTime.now())
        }
    }

    fun fail(migrationId: String, errorMessage: String) {
        jobs.computeIfPresent(migrationId) { _, job ->
            job.copy(status = MigrationJobStatus.FAILED, errorMessage = errorMessage, completedAt = LocalDateTime.now())
        }
    }

    fun rollback(migrationId: String) {
        jobs.computeIfPresent(migrationId) { _, job ->
            job.copy(status = MigrationJobStatus.ROLLED_BACK, completedAt = LocalDateTime.now())
        }
    }
}
