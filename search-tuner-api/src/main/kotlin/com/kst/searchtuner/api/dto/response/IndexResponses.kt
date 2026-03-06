package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.domain.index.IndexJob
import com.kst.searchtuner.core.domain.index.MigrationJob
import java.time.LocalDateTime

data class IndexJobResponse(
    val jobId: String,
    val type: String,
    val status: String,
    val total: Long,
    val indexed: Long,
    val progressPercent: Int,
    val errorMessage: String?,
    val startedAt: LocalDateTime,
    val completedAt: LocalDateTime?
) {
    companion object {
        fun from(job: IndexJob) = IndexJobResponse(
            jobId = job.id,
            type = job.type,
            status = job.status.name,
            total = job.total,
            indexed = job.indexed,
            progressPercent = job.progressPercent,
            errorMessage = job.errorMessage,
            startedAt = job.startedAt,
            completedAt = job.completedAt
        )
    }
}

data class MigrationJobResponse(
    val migrationId: String,
    val oldIndex: String,
    val newIndex: String,
    val alias: String,
    val status: String,
    val total: Long,
    val indexed: Long,
    val progressPercent: Int,
    val errorMessage: String?,
    val startedAt: LocalDateTime,
    val completedAt: LocalDateTime?
) {
    companion object {
        fun from(job: MigrationJob) = MigrationJobResponse(
            migrationId = job.id,
            oldIndex = job.oldIndex,
            newIndex = job.newIndex,
            alias = job.alias,
            status = job.status.name,
            total = job.total,
            indexed = job.indexed,
            progressPercent = job.progressPercent,
            errorMessage = job.errorMessage,
            startedAt = job.startedAt,
            completedAt = job.completedAt
        )
    }
}
