package com.kst.searchtuner.core.application.port.out

import com.kst.searchtuner.core.application.port.`in`.SearchProductQuery
import com.kst.searchtuner.core.application.port.`in`.SearchResult
import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig
import com.kst.searchtuner.core.domain.product.Product

interface ElasticsearchPort {
    fun search(query: SearchProductQuery): SearchResult
    fun analyzeText(text: String, indexName: String, analyzerName: String): List<String>
    fun sampleFieldValues(indexName: String, field: String, size: Int = 500): List<String>
    fun createIndex(indexName: String, config: AnalyzerConfig)
    fun bulkIndex(indexName: String, products: List<Product>)
    fun updateSynonyms(indexName: String, synonymContent: String)
    fun reloadSearchAnalyzers(indexName: String)
    fun createAlias(indexName: String, alias: String)
    fun switchAlias(alias: String, fromIndex: String, toIndex: String)
    fun deleteIndex(indexName: String)
    fun indexExists(indexName: String): Boolean
    fun countDocuments(indexName: String): Long
}
