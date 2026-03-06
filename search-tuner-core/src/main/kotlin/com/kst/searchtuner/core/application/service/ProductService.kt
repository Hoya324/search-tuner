package com.kst.searchtuner.core.application.service

import com.kst.searchtuner.core.application.port.`in`.SearchProductQuery
import com.kst.searchtuner.core.application.port.`in`.SearchProductUseCase
import com.kst.searchtuner.core.application.port.`in`.SearchResult
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.domain.product.Product

class ProductService(
    private val productPersistencePort: ProductPersistencePort,
    private val elasticsearchPort: ElasticsearchPort
) : SearchProductUseCase {

    override fun search(query: SearchProductQuery): SearchResult =
        elasticsearchPort.search(query)

    fun findById(id: Long): Product? = productPersistencePort.findById(id)

    fun findAll(page: Int, size: Int): List<Product> = productPersistencePort.findAll(page, size)

    fun save(product: Product): Product = productPersistencePort.save(product)
}
