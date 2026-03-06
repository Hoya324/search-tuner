package com.kst.searchtuner.core.application.service.metric

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class IrMetricCalculatorTest {

    // --- nDCG@10 ---

    @Test
    fun `nDCG perfect ranking returns 1_0`() {
        val relevances = listOf(3, 3, 2, 1, 0, 0, 0, 0, 0, 0)
        val ndcg = IrMetricCalculator.calculateNdcgAt(10, relevances)
        assertEquals(1.0, ndcg, 1e-9)
    }

    @Test
    fun `nDCG worst ranking returns less than 1`() {
        val relevances = listOf(0, 0, 0, 0, 0, 1, 2, 3, 0, 0)
        val ndcg = IrMetricCalculator.calculateNdcgAt(10, relevances)
        assertTrue(ndcg < 1.0, "Worst-order nDCG should be < 1.0")
        assertTrue(ndcg > 0.0, "Should still be > 0 since some relevant results exist")
    }

    @Test
    fun `nDCG all irrelevant returns 0`() {
        val relevances = listOf(0, 0, 0, 0, 0)
        val ndcg = IrMetricCalculator.calculateNdcgAt(10, relevances)
        assertEquals(0.0, ndcg, 1e-9)
    }

    @Test
    fun `nDCG empty list returns 0`() {
        assertEquals(0.0, IrMetricCalculator.calculateNdcgAt(10, emptyList()), 1e-9)
    }

    @Test
    fun `nDCG single perfect result at rank 1`() {
        val relevances = listOf(3)
        val ndcg = IrMetricCalculator.calculateNdcgAt(10, relevances)
        assertEquals(1.0, ndcg, 1e-9)
    }

    @Test
    fun `nDCG is discounted by rank`() {
        val best = IrMetricCalculator.calculateNdcgAt(10, listOf(3, 0, 0))
        val worse = IrMetricCalculator.calculateNdcgAt(10, listOf(0, 3, 0))
        assertTrue(best > worse, "Higher rank should yield higher nDCG")
    }

    @Test
    fun `nDCG cutoff k is respected`() {
        // relevant result only beyond cutoff k=2
        val ndcg = IrMetricCalculator.calculateNdcgAt(2, listOf(0, 0, 3, 3, 3))
        assertEquals(0.0, ndcg, 1e-9)
    }

    // --- P@5 ---

    @Test
    fun `precision at 5 all relevant returns 1_0`() {
        val relevances = listOf(3, 2, 1, 3, 2)
        val p5 = IrMetricCalculator.calculatePrecisionAt(5, relevances)
        assertEquals(1.0, p5, 1e-9)
    }

    @Test
    fun `precision at 5 none relevant returns 0`() {
        val relevances = listOf(0, 0, 0, 0, 0)
        val p5 = IrMetricCalculator.calculatePrecisionAt(5, relevances)
        assertEquals(0.0, p5, 1e-9)
    }

    @Test
    fun `precision at 5 mixed relevance`() {
        val relevances = listOf(3, 0, 2, 0, 1)
        val p5 = IrMetricCalculator.calculatePrecisionAt(5, relevances)
        assertEquals(0.6, p5, 1e-9)
    }

    @Test
    fun `precision at 5 ignores results beyond k`() {
        val relevances = listOf(3, 3, 0, 0, 0, 3, 3, 3)
        val p5 = IrMetricCalculator.calculatePrecisionAt(5, relevances)
        assertEquals(0.4, p5, 1e-9)
    }

    @Test
    fun `precision at 5 empty list returns 0`() {
        assertEquals(0.0, IrMetricCalculator.calculatePrecisionAt(5, emptyList()), 1e-9)
    }

    // --- MRR ---

    @Test
    fun `MRR first result relevant returns 1_0`() {
        val relevances = listOf(3, 0, 0, 0)
        assertEquals(1.0, IrMetricCalculator.calculateMrr(relevances), 1e-9)
    }

    @Test
    fun `MRR second result relevant returns 0_5`() {
        val relevances = listOf(0, 2, 0, 0)
        assertEquals(0.5, IrMetricCalculator.calculateMrr(relevances), 1e-9)
    }

    @Test
    fun `MRR no relevant result returns 0`() {
        val relevances = listOf(0, 0, 0, 0)
        assertEquals(0.0, IrMetricCalculator.calculateMrr(relevances), 1e-9)
    }

    @Test
    fun `MRR empty list returns 0`() {
        assertEquals(0.0, IrMetricCalculator.calculateMrr(emptyList()), 1e-9)
    }

    @Test
    fun `MRR middle result returns correct reciprocal rank`() {
        val relevances = listOf(0, 0, 1, 3, 3)
        val mrr = IrMetricCalculator.calculateMrr(relevances)
        assertEquals(1.0 / 3.0, mrr, 1e-9)
    }

    // --- Paired t-test ---

    @Test
    fun `paired t-test with identical scores returns p-value 1`() {
        val scores = listOf(0.7, 0.8, 0.6, 0.9, 0.75)
        val pValue = IrMetricCalculator.pairedTTest(scores, scores)
        assertEquals(1.0, pValue, 1e-6)
    }

    @Test
    fun `paired t-test with significantly different scores returns small p-value`() {
        val scoresA = List(30) { 0.5 }
        val scoresB = List(30) { 0.9 }
        val pValue = IrMetricCalculator.pairedTTest(scoresA, scoresB)
        assertTrue(pValue < 0.05, "Expected p-value < 0.05 for clearly different scores, got $pValue")
    }

    @Test
    fun `paired t-test with noisy similar scores returns non-significant p-value`() {
        val base = listOf(0.70, 0.72, 0.68, 0.71, 0.69, 0.73, 0.70, 0.71, 0.68, 0.72)
        val noisy = listOf(0.71, 0.71, 0.69, 0.70, 0.70, 0.72, 0.71, 0.70, 0.69, 0.73)
        val pValue = IrMetricCalculator.pairedTTest(base, noisy)
        assertTrue(pValue >= 0.05, "Expected non-significant difference, got p=$pValue")
    }

    @Test
    fun `paired t-test p-value is between 0 and 1`() {
        val a = listOf(0.6, 0.7, 0.5, 0.8, 0.65)
        val b = listOf(0.75, 0.85, 0.6, 0.9, 0.8)
        val pValue = IrMetricCalculator.pairedTTest(a, b)
        assertTrue(pValue in 0.0..1.0, "p-value must be in [0, 1], got $pValue")
    }
}
