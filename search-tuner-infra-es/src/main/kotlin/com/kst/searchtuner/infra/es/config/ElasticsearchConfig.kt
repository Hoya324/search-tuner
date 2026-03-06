package com.kst.searchtuner.infra.es.config

import co.elastic.clients.elasticsearch.ElasticsearchClient
import co.elastic.clients.json.jackson.JacksonJsonpMapper
import co.elastic.clients.transport.rest_client.RestClientTransport
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.apache.http.HttpHost
import org.elasticsearch.client.RestClient
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class ElasticsearchConfig(
    @Value("\${es.host:localhost}") private val host: String,
    @Value("\${es.port:9200}") private val port: Int
) {
    @Bean
    fun elasticsearchClient(): ElasticsearchClient {
        val restClient = RestClient.builder(HttpHost(host, port)).build()
        val mapper = JacksonJsonpMapper(jacksonObjectMapper())
        val transport = RestClientTransport(restClient, mapper)
        return ElasticsearchClient(transport)
    }
}
