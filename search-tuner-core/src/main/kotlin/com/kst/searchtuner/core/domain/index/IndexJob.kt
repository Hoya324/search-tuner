package com.kst.searchtuner.core.domain.index

import java.time.LocalDateTime

enum class IndexJobStatus { PENDING, RUNNING, COMPLETED, FAILED }

data class IndexJob(
    val id: String,
    val type: String,
    val status: IndexJobStatus = IndexJobStatus.PENDING,
    val total: Long = 0,
    val indexed: Long = 0,
    val errorMessage: String? = null,
    val startedAt: LocalDateTime = LocalDateTime.now(),
    val completedAt: LocalDateTime? = null
) {
    val progressPercent: Int get() = if (total == 0L) 0 else ((indexed * 100) / total).toInt()
}
