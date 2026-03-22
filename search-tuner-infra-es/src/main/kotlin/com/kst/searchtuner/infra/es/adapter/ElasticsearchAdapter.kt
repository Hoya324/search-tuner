package com.kst.searchtuner.infra.es.adapter

import co.elastic.clients.elasticsearch.ElasticsearchClient
import co.elastic.clients.elasticsearch._types.aggregations.StringTermsAggregate
import co.elastic.clients.elasticsearch._types.query_dsl.MultiMatchQuery
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType
import co.elastic.clients.elasticsearch.core.BulkRequest
import co.elastic.clients.elasticsearch.core.search.HighlightField
import co.elastic.clients.elasticsearch.indices.ReloadSearchAnalyzersRequest
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.kst.searchtuner.core.application.port.`in`.SearchHit
import com.kst.searchtuner.core.application.port.`in`.SearchProductQuery
import com.kst.searchtuner.core.application.port.`in`.SearchResult
import com.kst.searchtuner.core.application.port.out.ElasticsearchPort
import com.kst.searchtuner.core.domain.analyzer.AnalyzerConfig
import com.kst.searchtuner.core.domain.analyzer.DecompoundMode
import com.kst.searchtuner.core.domain.product.Product
import com.kst.searchtuner.infra.es.dto.ProductDocument
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.io.File
import java.io.StringReader

@Component
class ElasticsearchAdapter(
    private val esClient: ElasticsearchClient,
    @Value("\${es.synonyms.path:./docker/elasticsearch/config/synonyms/product_synonyms.txt}")
    private val synonymsFilePath: String
) : ElasticsearchPort {

    private val objectMapper = jacksonObjectMapper()

    override fun search(query: SearchProductQuery): SearchResult {
        val response = esClient.search({ req ->
            req.index(query.indexName)
                .from(query.from)
                .size(query.size)
                .query { q ->
                    q.multiMatch { mm ->
                        mm.query(query.query)
                            .fields("product_name^3", "brand^2", "description")
                            .type(TextQueryType.BestFields)
                    }
                }
                .apply {
                    if (query.highlight) {
                        highlight { h ->
                            h.fields("product_name", HighlightField.Builder().build())
                            h.fields("description", HighlightField.Builder().build())
                        }
                    }
                    if (query.explain) explain(true)
                }
        }, Map::class.java)

        val hits = response.hits().hits().mapNotNull { hit ->
            val source = hit.source() as? Map<*, *> ?: return@mapNotNull null
            SearchHit(
                productId = (source["id"] as? Number)?.toLong() ?: 0L,
                productName = source["product_name"]?.toString() ?: "",
                brand = source["brand"]?.toString(),
                category = source["category"]?.toString() ?: "",
                score = hit.score()?.toDouble() ?: 0.0,
                price = (source["price"] as? Number)?.toDouble(),
                highlights = hit.highlight().mapValues { (_, v) -> v }
            )
        }

        return SearchResult(
            hits = hits,
            total = response.hits().total()?.value() ?: 0L,
            took = response.took()
        )
    }

    override fun analyzeText(text: String, indexName: String, analyzerName: String): List<String> {
        val response = esClient.indices().analyze { req ->
            req.index(indexName).analyzer(analyzerName).text(text)
        }
        return response.tokens().map { it.token() }
    }

    override fun sampleFieldValues(indexName: String, field: String, size: Int): List<String> {
        val response = esClient.search({ req ->
            req.index(indexName)
                .size(0)
                .aggregations("field_values") { agg ->
                    agg.terms { t -> t.field(field).size(size) }
                }
        }, Void::class.java)

        val agg = response.aggregations()["field_values"]
            ?.sterms() as? StringTermsAggregate ?: return emptyList()

        return agg.buckets().array().map { it.key().stringValue() }
    }

    override fun createIndex(indexName: String, config: AnalyzerConfig) {
        val decompoundMode = config.decompoundMode.name.lowercase()
        val settingsJson = """
        {
          "settings": {
            "analysis": {
              "tokenizer": {
                "nori_mixed": {
                  "type": "nori_tokenizer",
                  "decompound_mode": "$decompoundMode"
                }
              },
              "filter": {
                "nori_pos_filter": {
                  "type": "nori_part_of_speech",
                  "stoptags": ${objectMapper.writeValueAsString(config.posFilter)}
                },
                "synonym_filter": {
                  "type": "synonym",
                  "synonyms_path": "synonyms/product_synonyms.txt",
                  "updateable": true
                }
              },
              "analyzer": {
                "korean_index": {
                  "type": "custom",
                  "tokenizer": "nori_mixed",
                  "filter": ["lowercase", "nori_pos_filter"]
                },
                "korean_search": {
                  "type": "custom",
                  "tokenizer": "nori_mixed",
                  "filter": ["lowercase", "nori_pos_filter", "synonym_filter"]
                },
                "korean_none": {
                  "type": "custom",
                  "tokenizer": "nori_tokenizer",
                  "filter": ["lowercase", "nori_pos_filter"]
                },
                "korean_discard": {
                  "type": "custom",
                  "tokenizer": "nori_tokenizer",
                  "filter": ["lowercase", "nori_pos_filter"]
                }
              }
            }
          },
          "mappings": {
            "properties": {
              "id": { "type": "long" },
              "product_name": {
                "type": "text",
                "analyzer": "korean_index",
                "search_analyzer": "korean_search",
                "fields": {
                  "keyword": { "type": "keyword", "ignore_above": 256 }
                }
              },
              "description": {
                "type": "text",
                "analyzer": "korean_index",
                "search_analyzer": "korean_search"
              },
              "brand": {
                "type": "text",
                "analyzer": "korean_index",
                "search_analyzer": "korean_search",
                "fields": {
                  "keyword": { "type": "keyword" }
                }
              },
              "category": { "type": "keyword" },
              "price": { "type": "scaled_float", "scaling_factor": 100 },
              "shop_id": { "type": "long" }
            }
          }
        }
        """.trimIndent()

        esClient.indices().create { req ->
            req.index(indexName).withJson(StringReader(settingsJson))
        }
    }

    override fun bulkIndex(indexName: String, products: List<Product>) {
        if (products.isEmpty()) return
        val bulk = BulkRequest.Builder()
        products.forEach { product ->
            bulk.operations { op ->
                op.index { idx ->
                    idx.index(indexName)
                        .id(product.id.toString())
                        .document(ProductDocument.from(product))
                }
            }
        }
        esClient.bulk(bulk.build())
    }

    override fun updateSynonyms(indexName: String, synonymContent: String) {
        File(synonymsFilePath).also { file ->
            file.parentFile?.mkdirs()
            file.writeText(synonymContent)
        }
        reloadSearchAnalyzers(indexName)
    }

    override fun reloadSearchAnalyzers(indexName: String) {
        esClient.indices().reloadSearchAnalyzers(
            ReloadSearchAnalyzersRequest.Builder().index(indexName).build()
        )
    }

    override fun createAlias(indexName: String, alias: String) {
        esClient.indices().putAlias { req -> req.index(indexName).name(alias) }
    }

    override fun switchAlias(alias: String, fromIndex: String, toIndex: String) {
        esClient.indices().updateAliases { req ->
            req.actions { a ->
                a.remove { r -> r.index(fromIndex).alias(alias) }
            }.actions { a ->
                a.add { ad -> ad.index(toIndex).alias(alias) }
            }
        }
    }

    override fun deleteIndex(indexName: String) {
        esClient.indices().delete { req -> req.index(indexName) }
    }

    override fun indexExists(indexName: String): Boolean =
        esClient.indices().exists { req -> req.index(indexName) }.value()

    override fun countDocuments(indexName: String): Long =
        esClient.count { req -> req.index(indexName) }.count()
}
