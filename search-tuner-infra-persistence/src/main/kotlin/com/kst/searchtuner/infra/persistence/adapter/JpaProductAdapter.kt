package com.kst.searchtuner.infra.persistence.adapter

import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.domain.product.Product
import com.kst.searchtuner.infra.persistence.entity.ProductJpaEntity
import com.kst.searchtuner.infra.persistence.repository.ProductJpaRepository
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component
import java.time.LocalDateTime

@Component
class JpaProductAdapter(
    private val productJpaRepository: ProductJpaRepository
) : ProductPersistencePort {

    override fun findById(id: Long): Product? =
        productJpaRepository.findById(id).map { it.toDomain() }.orElse(null)

    override fun findByCategory(category: String): List<Product> =
        productJpaRepository.findByCategory(category).map { it.toDomain() }

    override fun findByShopId(shopId: Long): List<Product> =
        productJpaRepository.findByShopId(shopId).map { it.toDomain() }

    override fun findAll(page: Int, size: Int): List<Product> =
        productJpaRepository.findAll(PageRequest.of(page, size)).content.map { it.toDomain() }

    override fun findUpdatedAfter(updatedAfter: LocalDateTime, page: Int, size: Int): List<Product> =
        productJpaRepository.findByUpdatedAtAfter(updatedAfter, PageRequest.of(page, size))
            .map { it.toDomain() }

    override fun countAll(): Long = productJpaRepository.count()

    override fun save(product: Product): Product =
        productJpaRepository.save(ProductJpaEntity.from(product)).toDomain()

    override fun saveAll(products: List<Product>): List<Product> =
        productJpaRepository.saveAll(products.map { ProductJpaEntity.from(it) }).map { it.toDomain() }
}
