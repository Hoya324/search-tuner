package com.kst.searchtuner.infra.es.index

import com.kst.searchtuner.core.domain.index.IndexJob
import com.kst.searchtuner.core.domain.index.IndexJobStatus
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap

@Component
class IndexJobRegistry {
    private val jobs = ConcurrentHashMap<String, IndexJob>()

    fun register(job: IndexJob): IndexJob {
        jobs[job.id] = job
        return job
    }

    fun get(jobId: String): IndexJob? = jobs[jobId]

    fun updateProgress(jobId: String, indexed: Long, total: Long) {
        jobs.computeIfPresent(jobId) { _, job ->
            job.copy(indexed = indexed, total = total, status = IndexJobStatus.RUNNING)
        }
    }

    fun complete(jobId: String) {
        jobs.computeIfPresent(jobId) { _, job ->
            job.copy(status = IndexJobStatus.COMPLETED, completedAt = LocalDateTime.now())
        }
    }

    fun fail(jobId: String, errorMessage: String) {
        jobs.computeIfPresent(jobId) { _, job ->
            job.copy(status = IndexJobStatus.FAILED, errorMessage = errorMessage, completedAt = LocalDateTime.now())
        }
    }
}
