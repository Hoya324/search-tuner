package com.kst.searchtuner.core.domain.product

import java.math.BigDecimal
import java.time.LocalDateTime

data class Product(
    val id: Long = 0,
    val shopId: Long,
    val productName: String,
    val description: String? = null,
    val brand: String? = null,
    val category: String,
    val price: BigDecimal? = null,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)
