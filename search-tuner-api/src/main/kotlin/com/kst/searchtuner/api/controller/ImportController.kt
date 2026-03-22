package com.kst.searchtuner.api.controller

import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.application.port.out.ShopPersistencePort
import com.kst.searchtuner.core.domain.product.Product
import com.kst.searchtuner.core.domain.shop.Shop
import com.opencsv.CSVReaderBuilder
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.InputStreamReader
import java.math.BigDecimal
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/v1/import")
@Tag(name = "Import", description = "CSV data import")
class ImportController(
    private val productPersistencePort: ProductPersistencePort,
    private val shopPersistencePort: ShopPersistencePort
) {

    @PostMapping("/products", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Import products from CSV file")
    fun importProducts(@RequestParam("file") file: MultipartFile): Map<String, Any> {
        val reader = CSVReaderBuilder(InputStreamReader(file.inputStream)).withSkipLines(1).build()
        val products = mutableListOf<Product>()
        var line: Array<String>?
        while (reader.readNext().also { line = it } != null) {
            val row = line!!
            if (row.size < 5) continue
            val shopId = row[0].trim().toLongOrNull() ?: continue
            products.add(Product(
                shopId = shopId,
                productName = row[1].trim(),
                description = row.getOrNull(2)?.trim(),
                brand = row.getOrNull(3)?.trim(),
                category = row[4].trim(),
                price = row.getOrNull(5)?.trim()?.let { BigDecimal(it) } ?: BigDecimal.ZERO
            ))
        }
        val saved = productPersistencePort.saveAll(products)
        return mapOf("imported" to saved.size, "message" to "${saved.size}개 상품이 임포트되었습니다.")
    }

    @PostMapping("/shops", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @Operation(summary = "Import shops from CSV file")
    fun importShops(@RequestParam("file") file: MultipartFile): Map<String, Any> {
        val reader = CSVReaderBuilder(InputStreamReader(file.inputStream)).withSkipLines(1).build()
        val shops = mutableListOf<Shop>()
        var line: Array<String>?
        while (reader.readNext().also { line = it } != null) {
            val row = line!!
            if (row.size < 2) continue
            shops.add(Shop(
                name = row[0].trim(),
                description = row.getOrNull(1)?.trim(),
                category = row.getOrNull(2)?.trim() ?: "general",
                createdAt = LocalDateTime.now(),
                updatedAt = LocalDateTime.now()
            ))
        }
        val saved = shopPersistencePort.saveAll(shops)
        return mapOf("imported" to saved.size, "message" to "${saved.size}개 가게가 임포트되었습니다.")
    }
}
