package com.kst.searchtuner.core.domain.synonym

import java.time.LocalDateTime

enum class SynonymSetStatus {
    PENDING_REVIEW,
    APPROVED,
    APPLIED
}

data class SynonymSet(
    val id: Long = 0,
    val name: String,
    val groups: List<SynonymGroup>,
    val status: SynonymSetStatus = SynonymSetStatus.PENDING_REVIEW,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun approve(): SynonymSet = copy(status = SynonymSetStatus.APPROVED, updatedAt = LocalDateTime.now())

    fun apply(): SynonymSet = copy(status = SynonymSetStatus.APPLIED, updatedAt = LocalDateTime.now())

    fun toSynonymFileContent(): String =
        groups.joinToString("\n") { it.toEsSynonymLine() }

    fun updateGroup(groupId: String, updated: SynonymGroup): SynonymSet =
        copy(groups = groups.map { if (it.id == groupId) updated else it }, updatedAt = LocalDateTime.now())
}
