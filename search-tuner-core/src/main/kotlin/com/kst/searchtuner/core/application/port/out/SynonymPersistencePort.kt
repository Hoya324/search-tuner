package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.domain.synonym.SynonymSet

interface SynonymPersistencePort {
    fun save(synonymSet: SynonymSet): SynonymSet
    fun findById(id: Long): SynonymSet?
    fun findAll(): List<SynonymSet>
    fun delete(id: Long)
}
