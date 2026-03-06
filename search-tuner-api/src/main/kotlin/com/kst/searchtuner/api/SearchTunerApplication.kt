package com.kst.searchtuner.api

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
@SpringBootApplication(
    scanBasePackages = [
        "com.kst.searchtuner.api",
        "com.kst.searchtuner.infra.persistence",
        "com.kst.searchtuner.infra.es",
        "com.kst.searchtuner.infra.llm"
    ]
)
class SearchTunerApplication

fun main(args: Array<String>) {
    runApplication<SearchTunerApplication>(*args)
}
