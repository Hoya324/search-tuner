"use client"

import { useState } from "react"
import { Search, Pencil, Trash2, AlertTriangle, CheckCircle2, Sparkles, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

interface SynonymGroup {
  id: number
  terms: string[]
  type: "EQUIVALENT" | "EXPLICIT"
  confidence: number
  source: "AI Generated" | "Manual" | "Imported"
  category: string
  approved?: boolean
  warning?: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function SynonymManager() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generatedSynonyms, setGeneratedSynonyms] = useState<SynonymGroup[]>([])
  const [applyStrategy, setApplyStrategy] = useState("reload")
  const [selectedSynonyms, setSelectedSynonyms] = useState<Set<number>>(new Set())
  const [generatedSetId, setGeneratedSetId] = useState<number | null>(null)
  const [generateConfig, setGenerateConfig] = useState({
    index: "products",
    field: "product_name",
    category: "all",
    sampleSize: 2000,
  })
  const [generateMode, setGenerateMode] = useState<"standard" | "from-product">("standard")
  const [productNameInput, setProductNameInput] = useState("")
  const [excludeExisting, setExcludeExisting] = useState(true)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const { data: synonymsData, error } = useSWR<{ synonyms: SynonymGroup[], lastUpdated: string }>("/api/synonyms", fetcher)

  const currentSynonyms = synonymsData?.synonyms || []
  const lastUpdated = synonymsData?.lastUpdated || null

  const filteredSynonyms = currentSynonyms.filter(
    (syn) =>
      searchQuery === "" ||
      syn.terms.some((term) => term.toLowerCase().includes(searchQuery.toLowerCase())) ||
      syn.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      let response: Response
      if (generateMode === "from-product") {
        if (!productNameInput.trim()) return
        response = await fetch("/api/synonyms/generate-from-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: productNameInput.trim(), excludeExisting }),
        })
      } else {
        response = await fetch("/api/synonyms/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generateConfig),
        })
      }

      if (!response.ok) throw new Error("Failed to generate synonyms")

      const data = await response.json()
      setGeneratedSynonyms(data.synonyms || [])
      setGeneratedSetId(data.synonymSetId ?? null)
      setSelectedSynonyms(new Set((data.synonyms || []).filter((s: SynonymGroup) => s.approved !== false).map((s: SynonymGroup) => s.id)))
      setShowGenerateDialog(false)
      toast.success("동의어 생성 완료", { description: `${(data.synonyms || []).length}개 그룹이 생성되었습니다` })
    } catch (err) {
      console.error("Generate error:", err)
      toast.error("동의어 생성 실패", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShowPreview = async () => {
    if (!generatedSetId) return
    setIsLoadingPreview(true)
    try {
      const response = await fetch(`/api/synonyms/${generatedSetId}/preview`)
      if (!response.ok) throw new Error("Failed to fetch preview")
      const text = await response.text()
      setPreviewContent(text)
      setShowPreviewDialog(true)
    } catch (err) {
      console.error("Preview error:", err)
      toast.error("미리보기 실패")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleApplySynonyms = async () => {
    setIsApplying(true)
    setShowPreviewDialog(false)
    try {
      const response = await fetch("/api/synonyms/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          synonymSetId: generatedSetId,
          strategy: applyStrategy === "reload" ? "RELOAD" : "BLUE_GREEN",
        }),
      })

      if (!response.ok) throw new Error("Failed to apply synonyms")

      mutate("/api/synonyms")
      setGeneratedSynonyms([])
      setGeneratedSetId(null)
      setSelectedSynonyms(new Set())
      toast.success("동의어 적용 완료")
    } catch (err) {
      console.error("Apply error:", err)
      toast.error("동의어 적용 실패", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsApplying(false)
    }
  }

  const handleDeleteSynonym = async (id: number) => {
    try {
      const response = await fetch(`/api/synonyms?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete synonym")
      mutate("/api/synonyms")
      toast.success("동의어 삭제 완료")
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("동의어 삭제 실패")
    }
  }

  const toggleSynonymSelection = (id: number) => {
    const newSet = new Set(selectedSynonyms)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedSynonyms(newSet)
  }

  const handleDownloadSynonyms = async () => {
    if (!generatedSetId) return
    try {
      const response = await fetch(`/api/synonyms/${generatedSetId}/preview`)
      if (!response.ok) throw new Error("Failed to fetch")
      const text = await response.text()
      const blob = new Blob([text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `synonyms_${generatedSetId}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("다운로드 완료")
    } catch {
      toast.error("다운로드 실패")
    }
  }

  const approvedCount = [...selectedSynonyms].length
  const totalGenerated = generatedSynonyms.length

  return (
    <div className="space-y-6">
      {/* Current Synonyms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">현재 적용된 동의어 사전</CardTitle>
              <CardDescription className="mt-1">
                총 {currentSynonyms.length}개 그룹
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                적용됨
              </Badge>
              <span className="text-xs text-muted-foreground">products 인덱스</span>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="동의어 그룹 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {error ? (
            <div className="text-sm text-destructive py-4 text-center">
              동의어 목록을 불러오는데 실패했습니다
            </div>
          ) : filteredSynonyms.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 동의어가 없습니다"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSynonyms.map((synonym, index) => (
                <div
                  key={synonym.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {synonym.terms.map((term, i) => (
                          <Badge key={i} variant="secondary" className="font-normal">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Type: {synonym.type}</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>Confidence: {synonym.confidence?.toFixed(2)}</span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>Source: {synonym.source}</span>
                      {synonym.category && (
                        <>
                          <span className="text-muted-foreground/50">|</span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {synonym.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSynonym(synonym.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogTrigger asChild>
          <Card className="border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-medium">AI 동의어 생성</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  상품 데이터를 분석하여 자동으로 동의어 그룹을 생성합니다
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI 동의어 생성</DialogTitle>
            <DialogDescription>
              상품 데이터를 분석하여 동의어 그룹을 자동으로 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>특정 상품명으로 생성</Label>
              <Switch
                checked={generateMode === "from-product"}
                onCheckedChange={(checked) => setGenerateMode(checked ? "from-product" : "standard")}
              />
            </div>

            {generateMode === "from-product" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>상품명 입력</Label>
                  <Input
                    placeholder="예: 두쫀쿠, 삼성 갤럭시 탭"
                    value={productNameInput}
                    onChange={(e) => setProductNameInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">쉼표로 여러 상품명 입력 가능</p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exclude-existing"
                    checked={excludeExisting}
                    onCheckedChange={(v) => setExcludeExisting(!!v)}
                  />
                  <Label htmlFor="exclude-existing" className="text-sm font-normal cursor-pointer">
                    기존 동의어 제외
                  </Label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Index</Label>
                  <Select
                    value={generateConfig.index}
                    onValueChange={(v) => setGenerateConfig(prev => ({ ...prev, index: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={generateConfig.field}
                    onValueChange={(v) => setGenerateConfig(prev => ({ ...prev, field: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_name">product_name</SelectItem>
                      <SelectItem value="description">description</SelectItem>
                      <SelectItem value="brand">brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Select
                    value={generateConfig.category}
                    onValueChange={(v) => setGenerateConfig(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sample Size</Label>
                  <Input
                    type="number"
                    value={generateConfig.sampleSize}
                    onChange={(e) => setGenerateConfig(prev => ({ ...prev, sampleSize: parseInt(e.target.value) || 2000 }))}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || (generateMode === "from-product" && !productNameInput.trim())}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  생성 시작
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Synonyms Review */}
      {generatedSynonyms.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">생성 결과 (리뷰 대기)</CardTitle>
                <CardDescription className="mt-1">
                  {totalGenerated}개 그룹 생성됨
                </CardDescription>
              </div>
              <Badge variant="secondary">
                선택: {approvedCount}/{totalGenerated}개
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {generatedSynonyms.map((synonym) => (
                <div
                  key={synonym.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    synonym.warning
                      ? "border-warning/50 bg-warning/5"
                      : selectedSynonyms.has(synonym.id)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-secondary/30"
                  )}
                >
                  <Checkbox
                    id={`syn-${synonym.id}`}
                    checked={selectedSynonyms.has(synonym.id)}
                    onCheckedChange={() => toggleSynonymSelection(synonym.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {synonym.terms.map((term, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {term}
                        </Badge>
                      ))}
                    </div>
                    {synonym.warning && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{synonym.warning}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-mono text-muted-foreground">
                    {synonym.confidence?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Apply Strategy */}
            <div className="pt-4 border-t border-border">
              <Label className="text-sm">적용 전략</Label>
              <RadioGroup
                value={applyStrategy}
                onValueChange={setApplyStrategy}
                className="mt-2 space-y-2"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="reload" id="reload" className="mt-0.5" />
                  <div>
                    <Label htmlFor="reload" className="text-sm font-normal cursor-pointer">
                      Reload (무중단, search_analyzer만)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      기존 색인 유지, 검색 분석기만 업데이트
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="blue-green" id="blue-green" className="mt-0.5" />
                  <div>
                    <Label htmlFor="blue-green" className="text-sm font-normal cursor-pointer">
                      Blue-Green (전체 재색인)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      새 인덱스 생성 후 alias 스위칭
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleShowPreview}
                disabled={isApplying || isLoadingPreview || approvedCount === 0 || !generatedSetId}
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    미리보기 로딩...
                  </>
                ) : isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    적용 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    선택한 동의어 적용
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleDownloadSynonyms} disabled={!generatedSetId}>
                <Download className="h-4 w-4 mr-2" />
                synonym.txt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>동의어 파일 미리보기</DialogTitle>
            <DialogDescription>
              Elasticsearch에 적용될 synonyms.txt 내용입니다
            </DialogDescription>
          </DialogHeader>
          <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap">
            {previewContent || "(비어있음)"}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>취소</Button>
            <Button onClick={handleApplySynonyms} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  적용 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  확인 후 적용
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
