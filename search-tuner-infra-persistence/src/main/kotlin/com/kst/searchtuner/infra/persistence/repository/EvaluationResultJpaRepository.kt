package com.kst.searchtuner.infra.persistence.repository

import com.kst.searchtuner.infra.persistence.entity.EvaluationResultJpaEntity
import org.springframework.data.jpa.repository.JpaRepository

interface EvaluationResultJpaRepository : JpaRepository<EvaluationResultJpaEntity, Long> {
    fun findByConfigLabel(configLabel: String): List<EvaluationResultJpaEntity>
}
