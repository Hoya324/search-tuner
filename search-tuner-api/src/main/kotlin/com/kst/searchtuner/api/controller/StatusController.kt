package com.kst.searchtuner.api.controller

import com.kst.searchtuner.api.dto.response.SystemStatusResponse
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/status")
@Tag(name = "Status", description = "System health and connection status")
class StatusController(
    private val elasticsearchPort: ElasticsearchPort,
    private val productPersistencePort: ProductPersistencePort
) {

    @GetMapping
    @Operation(summary = "Get system status (ES connection, MySQL connection, document counts)")
    fun getStatus(): SystemStatusResponse {
        val esHealth = try {
            val count = elasticsearchPort.countDocuments("products")
            SystemStatusResponse.EsHealth(connected = true, documentCount = count)
        } catch (e: Exception) {
            SystemStatusResponse.EsHealth(connected = false, documentCount = 0)
        }

        val mysqlHealth = try {
            productPersistencePort.countAll()
            SystemStatusResponse.DbHealth(connected = true)
        } catch (e: Exception) {
            SystemStatusResponse.DbHealth(connected = false)
        }

        return SystemStatusResponse(elasticsearch = esHealth, mysql = mysqlHealth)
    }
}
