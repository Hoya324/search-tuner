package com.kst.searchtuner.api.config

import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.application.port.out.EvaluationResultPort
import com.kst.searchtuner.core.application.port.out.LlmPort
import com.kst.searchtuner.core.application.port.out.ProductPersistencePort
import com.kst.searchtuner.core.application.port.out.SynonymPersistencePort
import com.kst.searchtuner.core.application.service.AnalyzerRecommendationService
import com.kst.searchtuner.core.application.service.ProductService
import com.kst.searchtuner.core.application.service.SearchQualityEvaluationService
import com.kst.searchtuner.core.application.service.SynonymGenerationService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class ServiceConfig {

    @Bean
    fun productService(
        productPersistencePort: ProductPersistencePort,
        elasticsearchPort: ElasticsearchPort
    ) = ProductService(productPersistencePort, elasticsearchPort)

    @Bean
    fun synonymGenerationService(
        llmPort: LlmPort,
        elasticsearchPort: ElasticsearchPort,
        synonymPersistencePort: SynonymPersistencePort
    ) = SynonymGenerationService(llmPort, elasticsearchPort, synonymPersistencePort)

    @Bean
    fun analyzerRecommendationService(
        elasticsearchPort: ElasticsearchPort,
        llmPort: LlmPort
    ) = AnalyzerRecommendationService(elasticsearchPort, llmPort)

    @Bean
    fun searchQualityEvaluationService(
        elasticsearchPort: ElasticsearchPort,
        llmPort: LlmPort,
        evaluationResultPort: EvaluationResultPort
    ) = SearchQualityEvaluationService(elasticsearchPort, llmPort, evaluationResultPort)
}
