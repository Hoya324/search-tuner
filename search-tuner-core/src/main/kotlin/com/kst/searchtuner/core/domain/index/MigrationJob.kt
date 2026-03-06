package com.kst.searchtuner.core.domain.index

import java.time.LocalDateTime

enum class MigrationJobStatus { CREATED, INDEXING, SWITCHING, COMPLETED, FAILED, ROLLED_BACK }

data class MigrationJob(
    val id: String,
    val oldIndex: String,
    val newIndex: String,
    val alias: String,
    val status: MigrationJobStatus = MigrationJobStatus.CREATED,
    val total: Long = 0,
    val indexed: Long = 0,
    val errorMessage: String? = null,
    val startedAt: LocalDateTime = LocalDateTime.now(),
    val completedAt: LocalDateTime? = null
) {
    val progressPercent: Int get() = if (total == 0L) 0 else ((indexed * 100) / total).toInt()
}
