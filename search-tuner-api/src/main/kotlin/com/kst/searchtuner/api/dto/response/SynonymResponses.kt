package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import com.kst.searchtuner.core.domain.synonym.SynonymSet
import com.kst.searchtuner.core.domain.synonym.SynonymSetStatus
import com.kst.searchtuner.core.domain.synonym.SynonymType
import java.time.LocalDateTime

data class SynonymGroupResponse(
    val id: String,
    val terms: List<String>,
    val type: SynonymType,
    val confidence: Double,
    val reasoning: String?
) {
    companion object {
        fun from(group: SynonymGroup) = SynonymGroupResponse(
            id = group.id,
            terms = group.terms,
            type = group.type,
            confidence = group.confidence,
            reasoning = group.reasoning
        )
    }
}

data class SynonymSetResponse(
    val id: Long,
    val name: String,
    val groups: List<SynonymGroupResponse>,
    val status: SynonymSetStatus,
    val groupCount: Int,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(synonymSet: SynonymSet) = SynonymSetResponse(
            id = synonymSet.id,
            name = synonymSet.name,
            groups = synonymSet.groups.map { SynonymGroupResponse.from(it) },
            status = synonymSet.status,
            groupCount = synonymSet.groups.size,
            createdAt = synonymSet.createdAt,
            updatedAt = synonymSet.updatedAt
        )
    }
}

data class SynonymApplicationResponse(
    val synonymSetId: Long,
    val strategy: String,
    val indexName: String,
    val appliedGroupCount: Int,
    val synonymContent: String
)
