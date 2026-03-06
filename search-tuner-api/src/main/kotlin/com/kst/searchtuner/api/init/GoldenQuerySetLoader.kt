package com.kst.searchtuner.api.init

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.kst.searchtuner.core.application.port.`in`.EvaluateSearchQualityUseCase
import com.kst.searchtuner.core.domain.evaluation.ProductRelevance
import com.kst.searchtuner.core.domain.evaluation.QueryEntry
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.annotation.Order
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
@Order(1)
class GoldenQuerySetLoader(
    private val evaluateSearchQualityUseCase: EvaluateSearchQualityUseCase
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(javaClass)
    private val yamlMapper = ObjectMapper(YAMLFactory()).registerKotlinModule()

    override fun run(args: ApplicationArguments) {
        try {
            val resource = ClassPathResource("evaluation/golden_query_set.yaml")
            val querySetFile = yamlMapper.readValue<GoldenQuerySetFile>(resource.inputStream)
            val entries = querySetFile.queries.map { it.toDomain() }
            evaluateSearchQualityUseCase.saveQuerySet("golden", entries)
            log.info("Loaded golden query set: ${entries.size} queries")
        } catch (ex: Exception) {
            log.warn("Failed to load golden query set: ${ex.message}")
        }
    }

    data class GoldenQuerySetFile(val queries: List<QueryEntryYaml>)

    data class QueryEntryYaml(
        val id: String,
        val query: String,
        val intent: String,
        @JsonProperty("expected_relevant") val expectedRelevant: List<ProductRelevanceYaml> = emptyList(),
        @JsonProperty("expected_irrelevant") val expectedIrrelevant: List<Long> = emptyList()
    ) {
        fun toDomain() = QueryEntry(
            id = id,
            query = query,
            intent = intent,
            expectedRelevant = expectedRelevant.map { ProductRelevance(it.productId, it.relevance) },
            expectedIrrelevant = expectedIrrelevant
        )
    }

    data class ProductRelevanceYaml(
        @JsonProperty("product_id") val productId: Long,
        val relevance: Int
    )
}
