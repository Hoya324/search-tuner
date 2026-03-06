package com.kst.searchtuner.core.application.service.metric

import kotlin.math.ln
import kotlin.math.sqrt

object IrMetricCalculator {

    /**
     * Normalized Discounted Cumulative Gain at k.
     * @param k cutoff rank (e.g. 10)
     * @param rankedRelevances relevance scores in rank order (0-based index = rank 1)
     */
    fun calculateNdcgAt(k: Int, rankedRelevances: List<Int>): Double {
        if (rankedRelevances.isEmpty()) return 0.0
        val dcg = dcg(k, rankedRelevances)
        val ideal = dcg(k, rankedRelevances.sortedDescending())
        return if (ideal == 0.0) 0.0 else dcg / ideal
    }

    /**
     * Precision at k: fraction of top-k results that are relevant (relevance > 0).
     */
    fun calculatePrecisionAt(k: Int, rankedRelevances: List<Int>): Double {
        if (rankedRelevances.isEmpty() || k <= 0) return 0.0
        val topK = rankedRelevances.take(k)
        val relevant = topK.count { it > 0 }
        return relevant.toDouble() / topK.size
    }

    /**
     * Mean Reciprocal Rank: 1/rank of the first relevant result.
     */
    fun calculateMrr(rankedRelevances: List<Int>): Double {
        if (rankedRelevances.isEmpty()) return 0.0
        val firstRelevantRank = rankedRelevances.indexOfFirst { it > 0 }
        return if (firstRelevantRank == -1) 0.0 else 1.0 / (firstRelevantRank + 1)
    }

    /**
     * Two-tailed paired t-test returning the p-value.
     * H0: mean difference between scoresA and scoresB is 0.
     */
    fun pairedTTest(scoresA: List<Double>, scoresB: List<Double>): Double {
        require(scoresA.size == scoresB.size) { "Score lists must have the same size" }
        val n = scoresA.size
        require(n >= 2) { "Need at least 2 samples for t-test" }

        val diffs = scoresA.zip(scoresB).map { (a, b) -> b - a }
        val meanDiff = diffs.sum() / n
        val variance = diffs.sumOf { (it - meanDiff) * (it - meanDiff) } / (n - 1)
        val se = sqrt(variance / n)

        if (se == 0.0) return if (meanDiff == 0.0) 1.0 else 0.0

        val tStat = meanDiff / se
        return tDistributionPValue(tStat, degreesOfFreedom = n - 1)
    }

    private fun dcg(k: Int, relevances: List<Int>): Double {
        return relevances.take(k).mapIndexed { index, rel ->
            if (rel == 0) 0.0 else rel.toDouble() / log2(index + 2.0)
        }.sum()
    }

    private fun log2(x: Double): Double = ln(x) / ln(2.0)

    /**
     * Two-tailed p-value using the t-distribution approximated via incomplete beta function.
     * Uses the approximation from Abramowitz & Stegun (26.7.8).
     */
    private fun tDistributionPValue(t: Double, degreesOfFreedom: Int): Double {
        val abst = kotlin.math.abs(t)
        val df = degreesOfFreedom.toDouble()
        val x = df / (df + abst * abst)
        val p = incompleteBeta(df / 2.0, 0.5, x)
        return p.coerceIn(0.0, 1.0)
    }

    /**
     * Regularized incomplete beta function I_x(a, b) computed via continued fraction expansion.
     */
    private fun incompleteBeta(a: Double, b: Double, x: Double): Double {
        if (x < 0.0 || x > 1.0) return Double.NaN
        if (x == 0.0) return 0.0
        if (x == 1.0) return 1.0

        val lbeta = lgamma(a + b) - lgamma(a) - lgamma(b)
        val front = kotlin.math.exp(lbeta + a * ln(x) + b * ln(1.0 - x)) / a

        // Use symmetry for better convergence
        return if (x < (a + 1.0) / (a + b + 2.0)) {
            front * betaContinuedFraction(a, b, x)
        } else {
            1.0 - (kotlin.math.exp(lbeta + b * ln(1.0 - x) + a * ln(x)) / b) * betaContinuedFraction(b, a, 1.0 - x)
        }
    }

    private fun betaContinuedFraction(a: Double, b: Double, x: Double): Double {
        val maxIterations = 200
        val epsilon = 1e-10
        var numerator = 1.0
        var c = 1.0
        var d = 1.0 - (a + b) * x / (a + 1.0)
        if (kotlin.math.abs(d) < 1e-30) d = 1e-30
        d = 1.0 / d

        var h = d
        for (m in 1..maxIterations) {
            val m2 = 2 * m
            // Even step
            var aa = m * (b - m) * x / ((a + m2 - 1.0) * (a + m2))
            d = 1.0 + aa * d
            if (kotlin.math.abs(d) < 1e-30) d = 1e-30
            c = 1.0 + aa / c
            if (kotlin.math.abs(c) < 1e-30) c = 1e-30
            d = 1.0 / d
            h *= d * c
            // Odd step
            aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1.0))
            d = 1.0 + aa * d
            if (kotlin.math.abs(d) < 1e-30) d = 1e-30
            c = 1.0 + aa / c
            if (kotlin.math.abs(c) < 1e-30) c = 1e-30
            d = 1.0 / d
            val delta = d * c
            h *= delta
            if (kotlin.math.abs(delta - 1.0) < epsilon) break
        }
        return h
    }

    /** Stirling approximation of the log-gamma function */
    private fun lgamma(x: Double): Double {
        // Lanczos approximation (g=7, n=9)
        val g = 7.0
        val c = doubleArrayOf(
            0.99999999999980993,
            676.5203681218851,
            -1259.1392167224028,
            771.32342877765313,
            -176.61502916214059,
            12.507343278686905,
            -0.13857109526572012,
            9.9843695780195716e-6,
            1.5056327351493116e-7
        )
        var xx = x
        if (xx < 0.5) {
            return ln(Math.PI / kotlin.math.sin(Math.PI * xx)) - lgamma(1.0 - xx)
        }
        xx -= 1.0
        var a = c[0]
        val t = xx + g + 0.5
        for (i in 1 until c.size) a += c[i] / (xx + i)
        return 0.5 * ln(2 * Math.PI) + (xx + 0.5) * ln(t) - t + ln(a)
    }
}
