package com.kst.searchtuner.api.dto.response

import com.kst.searchtuner.core.domain.shop.Shop
import java.time.LocalDateTime

data class ShopResponse(
    val id: Long,
    val name: String,
    val description: String?,
    val category: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun from(shop: Shop) = ShopResponse(
            id = shop.id,
            name = shop.name,
            description = shop.description,
            category = shop.category,
            createdAt = shop.createdAt,
            updatedAt = shop.updatedAt
        )
    }
}
