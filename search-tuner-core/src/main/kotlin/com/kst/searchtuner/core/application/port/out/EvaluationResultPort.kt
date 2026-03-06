package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.domain.evaluation.EvaluationResult

interface EvaluationResultPort {
    fun save(result: EvaluationResult): EvaluationResult
    fun findById(id: Long): EvaluationResult?
    fun findByConfigLabel(configLabel: String): List<EvaluationResult>
    fun findAll(): List<EvaluationResult>
}
