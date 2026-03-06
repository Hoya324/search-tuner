package com.kst.searchtuner.infra.persistence.adapter

import com.kst.searchtuner.core.application.port.out.SynonymPersistencePort
import com.kst.searchtuner.core.domain.synonym.SynonymSet
import com.kst.searchtuner.infra.persistence.entity.SynonymDictionaryJpaEntity
import com.kst.searchtuner.infra.persistence.repository.SynonymDictionaryJpaRepository
import org.springframework.stereotype.Component

@Component
class JpaSynonymAdapter(
    private val synonymDictionaryJpaRepository: SynonymDictionaryJpaRepository
) : SynonymPersistencePort {

    override fun save(synonymSet: SynonymSet): SynonymSet =
        synonymDictionaryJpaRepository.save(SynonymDictionaryJpaEntity.from(synonymSet)).toDomain()

    override fun findById(id: Long): SynonymSet? =
        synonymDictionaryJpaRepository.findById(id).map { it.toDomain() }.orElse(null)

    override fun findAll(): List<SynonymSet> =
        synonymDictionaryJpaRepository.findAll().map { it.toDomain() }

    override fun delete(id: Long) =
        synonymDictionaryJpaRepository.deleteById(id)
}
