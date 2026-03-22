package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.request.AnalyzeTextRequest
import com.kst.searchtuner.api.dto.request.CreateProductRequest
import com.kst.searchtuner.api.dto.request.SearchRequest
import com.kst.searchtuner.api.dto.response.ProductResponse
import com.kst.searchtuner.api.dto.response.SearchResponse
import com.kst.searchtuner.api.dto.response.TokenAnalysisResponse
import com.kst.searchtuner.core.application.port.`in`.AnalyzeTextQuery
import com.kst.searchtuner.core.application.port.`in`.RecommendAnalyzerUseCase
import com.kst.searchtuner.core.application.port.`in`.SearchProductQuery
import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.application.service.ProductService
import com.kst.searchtuner.core.domain.product.Product
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Product management and search")
class ProductController(
    private val productService: ProductService,
    private val recommendAnalyzerUseCase: RecommendAnalyzerUseCase,
    private val productPersistencePort: ProductPersistencePort
) {

    @GetMapping
    @Operation(summary = "List products with pagination, optionally filtered by shopId")
    fun listProducts(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) shopId: Long?
    ): List<ProductResponse> =
        if (shopId != null)
            productPersistencePort.findByShopId(shopId).map { ProductResponse.from(it) }
        else
            productService.findAll(page, size).map { ProductResponse.from(it) }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    fun getProduct(@PathVariable id: Long): ResponseEntity<ProductResponse> {
        val product = productService.findById(id) ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ProductResponse.from(product))
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    fun createProduct(@RequestBody request: CreateProductRequest): ProductResponse {
        val product = Product(
            shopId = request.shopId,
            productName = request.productName,
            description = request.description,
            brand = request.brand,
            category = request.category,
            price = request.price
        )
        return ProductResponse.from(productService.save(product))
    }

    @GetMapping("/search")
    @Operation(summary = "Search products via Elasticsearch")
    fun searchGet(
        @RequestParam q: String,
        @RequestParam(defaultValue = "0") from: Int,
        @RequestParam(defaultValue = "10") size: Int,
        @RequestParam(defaultValue = "products") index: String
    ): SearchResponse {
        val result = productService.search(
            SearchProductQuery(query = q, from = from, size = size, indexName = index)
        )
        return SearchResponse.from(result)
    }

    @PostMapping("/search")
    @Operation(summary = "Search products via Elasticsearch (with full options)")
    fun searchPost(@RequestBody request: SearchRequest): SearchResponse {
        val result = productService.search(
            SearchProductQuery(
                query = request.query,
                from = request.from,
                size = request.size,
                indexName = request.indexName,
                explain = request.explain,
                highlight = request.highlight
            )
        )
        return SearchResponse.from(result)
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product by ID")
    fun deleteProduct(@PathVariable id: Long): ResponseEntity<Void> {
        productPersistencePort.delete(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/search/analyze")
    @Operation(summary = "Analyze text using a Nori analyzer")
    fun analyzeText(@RequestBody request: AnalyzeTextRequest): TokenAnalysisResponse {
        val result = recommendAnalyzerUseCase.analyzeText(
            AnalyzeTextQuery(request.text, request.indexName, request.analyzerName)
        )
        return TokenAnalysisResponse(request.analyzerName, result.tokens)
    }
}
