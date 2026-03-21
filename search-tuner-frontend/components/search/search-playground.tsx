"use client"

import { useState } from "react"
import { Search, ChevronDown, ChevronRight, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface TokenResult {
  config: string
  tokens: string[]
}

interface SearchResult {
  id: number
  title: string
  store: string
  price: number
  category: string
  score: number
  matchInfo: string
  explain?: {
    field: string
    term: string
    score: number
  }[]
}

interface SearchResponse {
  results: SearchResult[]
  tokens: TokenResult[]
  totalHits: number
  took: number
}

export function SearchPlayground() {
  const [query, setQuery] = useState("")
  const [searchConfig, setSearchConfig] = useState("config-b")
  const [searchedQuery, setSearchedQuery] = useState("")
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setSearchedQuery(query)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          config: searchConfig,
          explain: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      setSearchResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
      setSearchResponse(null)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedResults)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedResults(newSet)
  }

  const tokenResults = searchResponse?.tokens || null
  const searchResults = searchResponse?.results || []

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="검색어를 입력하세요 (예: 캐구 패딩, 블루투쓰 이어폰)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
            </Button>
          </div>

          <div className="mt-4">
            <Label className="text-sm text-muted-foreground">검색 설정</Label>
            <RadioGroup
              value={searchConfig}
              onValueChange={setSearchConfig}
              className="mt-2 flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="config-a" id="config-a" />
                <Label htmlFor="config-a" className="text-sm font-normal cursor-pointer">
                  Config A (동의어 없음)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="config-b" id="config-b" />
                <Label htmlFor="config-b" className="text-sm font-normal cursor-pointer">
                  Config B (AI 동의어 적용)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compare" id="compare" />
                <Label htmlFor="compare" className="text-sm font-normal cursor-pointer">
                  나란히 비교
                </Label>
              </div>
            </RadioGroup>
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

      {/* Token Analysis */}
      {searchedQuery && tokenResults && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">토큰 분석 결과</CardTitle>
              {searchResponse && (
                <span className="text-xs text-muted-foreground">
                  {searchResponse.took}ms
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              입력: <span className="font-medium text-foreground">&quot;{searchedQuery}&quot;</span>
            </div>
            {tokenResults.map((result, i) => (
              <div key={i} className="space-y-2">
                <div className="text-xs text-muted-foreground">{result.config} 토큰:</div>
                <div className="flex flex-wrap gap-2">
                  {result.tokens.map((token, j) => (
                    <Badge
                      key={j}
                      variant={i === 1 ? "default" : "secondary"}
                      className={cn(
                        "font-mono text-xs",
                        i === 1 && j >= 2 && "bg-primary/20 text-primary border border-primary/30"
                      )}
                    >
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchedQuery && !isLoading && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                검색 결과 ({searchResponse?.totalHits || searchResults.length}건)
              </CardTitle>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </p>
                <p className="text-xs text-muted-foreground/70">
                  동의어 설정을 확인하거나 다른 검색어를 시도해보세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <Collapsible
                    key={result.id}
                    open={expandedResults.has(result.id)}
                    onOpenChange={() => toggleExpand(result.id)}
                  >
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{index + 1}.</span>
                            <h3 className="font-medium text-sm truncate">{result.title}</h3>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{result.store}</span>
                            <span className="text-muted-foreground/50">|</span>
                            <span className="text-foreground font-medium">
                              {result.price?.toLocaleString()}원
                            </span>
                            <span className="text-muted-foreground/50">|</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {result.category}
                            </Badge>
                          </div>
                          {result.matchInfo && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">매칭:</span>
                              <span className="text-primary">{result.matchInfo}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-success">
                            {result.score?.toFixed(2)}
                          </span>
                          {result.explain && (
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {expandedResults.has(result.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                      </div>
                      {result.explain && (
                        <CollapsibleContent>
                          <div className="mt-4 rounded-md bg-background p-3 font-mono text-xs">
                            <div className="text-muted-foreground mb-2">Explain Score:</div>
                            {result.explain.map((exp, i) => (
                              <div key={i} className="text-muted-foreground">
                                BM25({exp.field}:{exp.term}) = <span className="text-foreground">{exp.score?.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="mt-2 pt-2 border-t border-border text-foreground">
                              total = {result.score?.toFixed(2)}
                            </div>
                          </div>
                        </CollapsibleContent>
                      )}
                    </div>
                  </Collapsible>
                ))}
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
              <p className="mt-4 text-sm text-muted-foreground">검색 중...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!searchedQuery && !isLoading && (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">검색어를 입력하세요</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                검색어를 입력하고 토큰 분석 결과와 검색 결과를 확인하세요.
                동의어 설정에 따른 변화를 실시간으로 비교할 수 있습니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => setQuery("캐구 패딩")}>
                  캐구 패딩
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQuery("블루투쓰 이어폰")}>
                  블루투쓰 이어폰
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
