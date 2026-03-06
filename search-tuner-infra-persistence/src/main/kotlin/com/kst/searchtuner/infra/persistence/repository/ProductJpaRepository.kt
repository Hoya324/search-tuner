package com.kst.searchtuner.infra.persistence.repository

import com.kst.searchtuner.infra.persistence.entity.ProductJpaEntity
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface ProductJpaRepository : JpaRepository<ProductJpaEntity, Long> {
    fun findByCategory(category: String): List<ProductJpaEntity>
    fun findByShopId(shopId: Long): List<ProductJpaEntity>
    fun findByUpdatedAtAfter(updatedAt: LocalDateTime, pageable: Pageable): List<ProductJpaEntity>
}
