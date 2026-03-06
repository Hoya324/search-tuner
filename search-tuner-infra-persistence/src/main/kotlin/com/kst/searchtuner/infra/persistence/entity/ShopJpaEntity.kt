package com.kst.searchtuner.infra.persistence.entity

import com.kst.searchtuner.core.domain.shop.Shop
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "shop")
class ShopJpaEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val name: String,

    @Column(length = 1000)
    val description: String? = null,

    @Column(nullable = false, length = 100)
    val category: String,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = Shop(
        id = id,
        name = name,
        description = description,
        category = category,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    companion object {
        fun from(shop: Shop) = ShopJpaEntity(
            id = shop.id,
            name = shop.name,
            description = shop.description,
            category = shop.category,
            createdAt = shop.createdAt,
            updatedAt = shop.updatedAt
        )
    }
}
