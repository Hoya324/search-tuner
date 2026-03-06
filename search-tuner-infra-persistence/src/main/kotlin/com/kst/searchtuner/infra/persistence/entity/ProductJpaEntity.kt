package com.kst.searchtuner.infra.persistence.entity

import com.kst.searchtuner.core.domain.product.Product
import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(
    name = "product",
    indexes = [
        Index(name = "idx_product_shop_id", columnList = "shopId"),
        Index(name = "idx_product_category", columnList = "category"),
        Index(name = "idx_product_updated_at", columnList = "updatedAt")
    ]
)
class ProductJpaEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val shopId: Long,

    @Column(nullable = false, length = 500)
    val productName: String,

    @Column(columnDefinition = "TEXT")
    val description: String? = null,

    @Column(length = 255)
    val brand: String? = null,

    @Column(nullable = false, length = 100)
    val category: String,

    @Column(precision = 12, scale = 2)
    val price: BigDecimal? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun toDomain() = Product(
        id = id,
        shopId = shopId,
        productName = productName,
        description = description,
        brand = brand,
        category = category,
        price = price,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    companion object {
        fun from(product: Product) = ProductJpaEntity(
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
