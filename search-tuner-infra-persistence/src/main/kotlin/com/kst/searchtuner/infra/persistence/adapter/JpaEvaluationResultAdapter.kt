package com.kst.searchtuner.infra.persistence.adapter

import com.kst.searchtuner.core.application.port.out.EvaluationResultPort
import com.kst.searchtuner.core.domain.evaluation.EvaluationResult
import com.kst.searchtuner.infra.persistence.entity.EvaluationResultJpaEntity
import com.kst.searchtuner.infra.persistence.repository.EvaluationResultJpaRepository
import org.springframework.stereotype.Component

@Component
class JpaEvaluationResultAdapter(
    private val evaluationResultJpaRepository: EvaluationResultJpaRepository
) : EvaluationResultPort {

    override fun save(result: EvaluationResult): EvaluationResult =
        evaluationResultJpaRepository.save(EvaluationResultJpaEntity.from(result)).toDomain()

    override fun findById(id: Long): EvaluationResult? =
        evaluationResultJpaRepository.findById(id).map { it.toDomain() }.orElse(null)

    override fun findByConfigLabel(configLabel: String): List<EvaluationResult> =
        evaluationResultJpaRepository.findByConfigLabel(configLabel).map { it.toDomain() }

    override fun findAll(): List<EvaluationResult> =
        evaluationResultJpaRepository.findAll().map { it.toDomain() }
}
