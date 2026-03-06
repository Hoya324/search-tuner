package com.kst.searchtuner.infra.persistence.repository

import com.kst.searchtuner.infra.persistence.entity.SynonymDictionaryJpaEntity
import org.springframework.data.jpa.repository.JpaRepository

interface SynonymDictionaryJpaRepository : JpaRepository<SynonymDictionaryJpaEntity, Long>
