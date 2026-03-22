package com.kst.searchtuner.api.dto.request

data class GenerateFromProductRequest(
    val productName: String,
    val excludeExisting: Boolean = true
)
