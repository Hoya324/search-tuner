package com.kst.searchtuner.core.domain.synonym

enum class SynonymType {
    /** All terms are interchangeable (A = B = C) */
    EQUIVALENT,
    /** One-way expansion: term1 => term2 (searching term1 also finds term2) */
    ONEWAY
}
