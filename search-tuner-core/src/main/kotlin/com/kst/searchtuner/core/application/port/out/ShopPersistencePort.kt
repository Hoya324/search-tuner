package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.domain.shop.Shop

interface ShopPersistencePort {
    fun findById(id: Long): Shop?
    fun findAll(): List<Shop>
    fun findAll(page: Int, size: Int): List<Shop>
    fun countAll(): Long
    fun save(shop: Shop): Shop
    fun saveAll(shops: List<Shop>): List<Shop>
    fun delete(id: Long)
}
