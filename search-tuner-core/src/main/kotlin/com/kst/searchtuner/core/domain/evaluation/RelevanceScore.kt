package com.kst.searchtuner.core.domain.evaluation

/**
 * TREC-DL 2023 4-point relevance scale
 */
enum class RelevanceScore(val value: Int) {
    IRRELEVANT(0),
    PARTIALLY_RELEVANT(1),
    HIGHLY_RELEVANT(2),
    PERFECTLY_RELEVANT(3);

    companion object {
        fun of(value: Int): RelevanceScore = entries.first { it.value == value }
    }
}
