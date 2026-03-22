package com.kst.searchtuner.api.dto.request

data class SuggestForProductRequest(
    val productName: String,
    val category: String? = null
)
