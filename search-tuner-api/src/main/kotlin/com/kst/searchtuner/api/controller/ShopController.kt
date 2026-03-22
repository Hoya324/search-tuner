package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.response.ShopResponse
import com.kst.searchtuner.core.application.port.out.ShopPersistencePort
import com.kst.searchtuner.core.domain.shop.Shop
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

data class CreateShopRequest(
    val name: String,
    val description: String? = null,
    val category: String
)

@RestController
@RequestMapping("/api/v1/shops")
@Tag(name = "Shops", description = "Shop management")
class ShopController(
    private val shopPersistencePort: ShopPersistencePort
) {

    @GetMapping
    @Operation(summary = "List shops with pagination")
    fun listShops(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): List<ShopResponse> =
        shopPersistencePort.findAll(page, size).map { ShopResponse.from(it) }

    @PostMapping
    @Operation(summary = "Create a new shop")
    fun createShop(@RequestBody request: CreateShopRequest): ShopResponse {
        val shop = Shop(
            name = request.name,
            description = request.description,
            category = request.category,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )
        return ShopResponse.from(shopPersistencePort.save(shop))
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shop by ID")
    fun deleteShop(@PathVariable id: Long): ResponseEntity<Void> {
        shopPersistencePort.delete(id)
        return ResponseEntity.noContent().build()
    }
}
