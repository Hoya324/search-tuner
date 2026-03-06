package com.kst.searchtuner.infra.es.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.kst.searchtuner.core.domain.product.Product
import java.math.BigDecimal

data class ProductDocument(
    val id: Long,
    @JsonProperty("product_name") val productName: String,
    val description: String?,
    val brand: String?,
    val category: String,
    val price: BigDecimal?,
    @JsonProperty("shop_id") val shopId: Long
) {
    companion object {
        fun from(product: Product) = ProductDocument(
            id = product.id,
            productName = product.productName,
            description = product.description,
            brand = product.brand,
            category = product.category,
            price = product.price,
            shopId = product.shopId
        )
    }
}
