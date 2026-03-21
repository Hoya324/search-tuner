"use client"

import { useState } from "react"
import { Play, Star, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AnalyzerConfig {
  id: string
  name: string
  mode: string
  recommended?: boolean
  description?: string
}

interface TokenResult {
  configId: string
  configName: string
  mode: string
  tokens: string[]
  warning?: string
  success?: string
  recommended?: boolean
}

interface AnalyzeResponse {
  results: TokenResult[]
  recommendation?: string
  configs?: AnalyzerConfig[]
}

export function AnalyzerLab() {
  const [testText, setTestText] = useState("")
  const [analyzedText, setAnalyzedText] = useState("")
  const [results, setResults] = useState<TokenResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null)
  const [recommendedConfigId, setRecommendedConfigId] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!testText.trim()) return

    setIsLoading(true)
    setError(null)
    setAnalyzedText(testText)

    try {
      const response = await fetch("/api/analyzers/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const data: AnalyzeResponse = await response.json()
      setResults(data.results || [])
      setAiRecommendation(data.recommendation || null)
      
      // Find recommended config
      const recommended = data.results?.find(r => r.recommended)
      setRecommendedConfigId(recommended?.configId || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyConfig = async (configId: string) => {
    try {
      const response = await fetch("/api/analyzers/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "apply",
          configId 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to apply configuration")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply config")
    }
  }

  return (
    <div className="space-y-6">
      {/* Test Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">테스트 텍스트</CardTitle>
          <CardDescription>
            분석할 텍스트를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="캐나다구스 남성용겨울패딩 무선블루투스이어폰"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="mt-4 flex items-center gap-4">
            <Button onClick={handleAnalyze} disabled={!testText.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              분석 실행
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestText("캐나다구스 남성용겨울패딩 무선블루투스이어폰")}
              >
                예시 1
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestText("나이키 에어맥스 운동화")}
              >
                예시 2
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">토큰화 비교 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result) => (
              <div
                key={result.configId}
                className={cn(
                  "rounded-lg border p-4",
                  result.recommended
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-secondary/30"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-medium text-sm">{result.configName}:</span>
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {result.mode}
                  </code>
                  {result.recommended && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      AI 추천
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-3 rounded-md bg-background border border-border">
                  {result.tokens.map((token, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className={cn(
                        "font-mono text-xs",
                        result.recommended && "bg-primary/20 text-primary border border-primary/30"
                      )}
                    >
                      {token}
                    </Badge>
                  ))}
                </div>

                {result.warning && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{result.warning}</span>
                  </div>
                )}
                
                {result.success && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{result.success}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendation */}
      {results.length > 0 && aiRecommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              AI 추천 근거
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-foreground whitespace-pre-line">
                {aiRecommendation}
              </p>
            </div>
            {recommendedConfigId && (
              <div className="mt-4">
                <Button onClick={() => handleApplyConfig(recommendedConfigId)}>
                  추천 설정을 인덱스에 적용
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">분석 중...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Info className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">분석할 텍스트를 입력하세요</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                여러 분석기 설정의 토큰화 결과를 나란히 비교하고
                AI 추천을 받을 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
