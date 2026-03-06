package com.kst.searchtuner.core.domain.synonym

data class SynonymGroup(
    val id: String,
    val terms: List<String>,
    val type: SynonymType,
    val confidence: Double,
    val reasoning: String? = null
) {
    /** Renders to Elasticsearch synonym filter format */
    fun toEsSynonymLine(): String = when (type) {
        SynonymType.EQUIVALENT -> terms.joinToString(", ")
        SynonymType.ONEWAY -> "${terms.first()} => ${terms.drop(1).joinToString(", ")}"
    }
}
