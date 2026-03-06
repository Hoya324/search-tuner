package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.domain.product.Product
import java.time.LocalDateTime

interface ProductPersistencePort {
    fun findById(id: Long): Product?
    fun findByCategory(category: String): List<Product>
    fun findByShopId(shopId: Long): List<Product>
    fun findAll(page: Int, size: Int): List<Product>
    fun findUpdatedAfter(updatedAfter: LocalDateTime, page: Int, size: Int): List<Product>
    fun countAll(): Long
    fun save(product: Product): Product
    fun saveAll(products: List<Product>): List<Product>
}
