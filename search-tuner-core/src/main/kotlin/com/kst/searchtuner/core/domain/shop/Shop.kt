package com.kst.searchtuner.core.domain.shop

import java.time.LocalDateTime

data class Shop(
    val id: Long = 0,
    val name: String,
    val description: String? = null,
    val category: String,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)
