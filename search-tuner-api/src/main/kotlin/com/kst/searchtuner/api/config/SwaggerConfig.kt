package com.kst.searchtuner.api.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {

    @Bean
    fun openAPI(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("Korean Search Tuner API")
                .description("AI-powered Elasticsearch search quality tuning for Korean e-commerce")
                .version("1.0.0")
        )
}
