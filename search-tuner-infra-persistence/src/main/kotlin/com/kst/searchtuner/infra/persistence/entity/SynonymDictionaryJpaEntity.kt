package com.kst.searchtuner.infra.persistence.entity

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.kst.searchtuner.core.domain.synonym.SynonymGroup
import com.kst.searchtuner.core.domain.synonym.SynonymSet
import com.kst.searchtuner.core.domain.synonym.SynonymSetStatus
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "synonym_dictionary")
class SynonymDictionaryJpaEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false, length = 50)
    val status: String = SynonymSetStatus.PENDING_REVIEW.name,

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    val termsJson: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain(): SynonymSet {
        val groups: List<SynonymGroup> = objectMapper.readValue(termsJson)
        return SynonymSet(
            id = id,
            name = name,
            groups = groups,
            status = SynonymSetStatus.valueOf(status),
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        private val objectMapper = jacksonObjectMapper()

        fun from(synonymSet: SynonymSet) = SynonymDictionaryJpaEntity(
            id = synonymSet.id,
            name = synonymSet.name,
            status = synonymSet.status.name,
            termsJson = objectMapper.writeValueAsString(synonymSet.groups),
            createdAt = synonymSet.createdAt,
            updatedAt = synonymSet.updatedAt
        )
    }
}
