package com.kst.searchtuner.infra.persistence.entity

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import com.kst.searchtuner.core.domain.evaluation.QueryEvaluationScore
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "evaluation_result",
    indexes = [Index(name = "idx_eval_config_label", columnList = "configLabel")]
)
class EvaluationResultJpaEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val configLabel: String,

    val querySetId: String? = null,

    val ndcgAt10: Double? = null,

    val precisionAt5: Double? = null,

    val mrr: Double? = null,

    val queryCount: Int? = null,

    @Column(columnDefinition = "LONGTEXT")
    val detailJson: String? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain(): EvaluationResult {
        val perQueryScores: List<QueryEvaluationScore> = detailJson?.let { objectMapper.readValue(it) } ?: emptyList()
        return EvaluationResult(
            id = id,
            configLabel = configLabel,
            querySetId = querySetId,
            ndcgAt10 = ndcgAt10 ?: 0.0,
            precisionAt5 = precisionAt5 ?: 0.0,
            mrr = mrr ?: 0.0,
            queryCount = queryCount ?: 0,
            perQueryScores = perQueryScores,
            createdAt = createdAt
        )
    }

    companion object {
        private val objectMapper = jacksonObjectMapper()

        fun from(result: EvaluationResult) = EvaluationResultJpaEntity(
            id = result.id,
            configLabel = result.configLabel,
            querySetId = result.querySetId,
            ndcgAt10 = result.ndcgAt10,
            precisionAt5 = result.precisionAt5,
            mrr = result.mrr,
            queryCount = result.queryCount,
            detailJson = objectMapper.writeValueAsString(result.perQueryScores),
            createdAt = result.createdAt
        )
    }
}
