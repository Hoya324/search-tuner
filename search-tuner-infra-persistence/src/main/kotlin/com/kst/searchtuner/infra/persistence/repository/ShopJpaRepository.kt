package com.kst.searchtuner.infra.persistence.repository

import com.kst.searchtuner.infra.persistence.entity.ShopJpaEntity
import org.springframework.data.jpa.repository.JpaRepository

interface ShopJpaRepository : JpaRepository<ShopJpaEntity, Long>
