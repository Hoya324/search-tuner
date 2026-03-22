package com.kst.searchtuner.infra.persistence.adapter

import com.kst.searchtuner.core.application.port.out.ShopPersistencePort
import com.kst.searchtuner.core.domain.shop.Shop
import com.kst.searchtuner.infra.persistence.entity.ShopJpaEntity
import com.kst.searchtuner.infra.persistence.repository.ShopJpaRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component

@Component
class JpaShopAdapter(
    private val shopJpaRepository: ShopJpaRepository
) : ShopPersistencePort {

    override fun findById(id: Long): Shop? =
        shopJpaRepository.findById(id).map { it.toDomain() }.orElse(null)

    override fun findAll(): List<Shop> =
        shopJpaRepository.findAll().map { it.toDomain() }

    override fun findAll(page: Int, size: Int): List<Shop> =
        shopJpaRepository.findAll(PageRequest.of(page, size)).content.map { it.toDomain() }

    override fun countAll(): Long = shopJpaRepository.count()

    override fun save(shop: Shop): Shop =
        shopJpaRepository.save(ShopJpaEntity.from(shop)).toDomain()

    override fun saveAll(shops: List<Shop>): List<Shop> =
        shopJpaRepository.saveAll(shops.map { ShopJpaEntity.from(it) }).map { it.toDomain() }

    override fun delete(id: Long) = shopJpaRepository.deleteById(id)
}
