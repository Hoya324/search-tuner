package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.application.port.`in`.SearchResult
import com.kst.searchtuner.core.domain.product.Product
import java.math.BigDecimal
import java.time.LocalDateTime

data class ProductResponse(
    val id: Long,
    val shopId: Long,
    val productName: String,
    val description: String?,
    val brand: String?,
    val category: String,
    val price: BigDecimal?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(product: Product) = ProductResponse(
            id = product.id,
            shopId = product.shopId,
            productName = product.productName,
            description = product.description,
            brand = product.brand,
            category = product.category,
            price = product.price,
            createdAt = product.createdAt,
            updatedAt = product.updatedAt
        )
    }
}

data class SearchHitResponse(
    val productId: Long,
    val productName: String,
    val brand: String?,
    val category: String,
    val score: Double,
    val highlights: Map<String, List<String>>
)

data class SearchResponse(
    val hits: List<SearchHitResponse>,
    val total: Long,
    val took: Long
) {
    companion object {
        fun from(result: SearchResult) = SearchResponse(
            hits = result.hits.map {
                SearchHitResponse(it.productId, it.productName, it.brand, it.category, it.score, it.highlights)
            },
            total = result.total,
            took = result.took
        )
    }
}

data class TokenAnalysisResponse(
    val analyzerName: String,
    val tokens: List<String>
)
