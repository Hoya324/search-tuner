"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, Upload, Loader2, ChevronRight, ArrowLeft } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Shop {
  id: number
  name: string
  category: string
  description?: string
}

interface Product {
  id: number
  productName: string
  category: string
  brand?: string
  price: number
  shopId: number
}

// ── Shop Products Panel (드릴다운) ─────────────────────────────────────────────

function ShopProductsPanel({ shop, onBack }: { shop: Shop; onBack: () => void }) {
  const { data: products, mutate, isLoading } = useSWR<Product[]>(
    `/api/products?shopId=${shop.id}`,
    fetcher
  )
  const { data: meta } = useSWR<{ categories: string[]; brands: string[] }>("/api/products/meta", fetcher)
  const [newProduct, setNewProduct] = useState({ productName: "", category: "", brand: "", price: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          productName: newProduct.productName,
          category: newProduct.category,
          brand: newProduct.brand || undefined,
          price: Number(newProduct.price) || 0,
          description: undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create product")
      const createdName = newProduct.productName
      const createdCategory = newProduct.category
      setNewProduct({ productName: "", category: "", brand: "", price: "" })
      setDialogOpen(false)
      await mutate()
      toast.success(`"${createdName}" 등록 완료`)

      // Check for synonym suggestions
      try {
        const suggestRes = await fetch("/api/synonyms/suggest-for-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: createdName, category: createdCategory }),
        })
        if (suggestRes.ok) {
          const suggestion = await suggestRes.json()
          if ((suggestion.existingGroups?.length ?? 0) > 0 || (suggestion.suggestedNewTerms?.length ?? 0) > 0) {
            toast.info("동의어 제안", {
              description: `"${createdName}"과 관련된 동의어가 있습니다`,
              action: { label: "동의어 페이지로", onClick: () => window.location.href = "/synonyms" },
              duration: 8000,
            })
          }
        }
      } catch {
        // Synonym suggestion failure is non-critical, ignore
      }
    } catch (err) {
      toast.error("상품 등록 실패", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
      await mutate()
      toast.success("상품 삭제 완료")
    } catch {
      toast.error("상품 삭제 실패")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          가게 목록
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="font-semibold">{shop.name}</span>
          <span className="ml-2 text-sm text-muted-foreground">{shop.category}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">총 {products?.length ?? 0}개 상품</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              상품 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{shop.name} — 새 상품 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>상품명</Label>
                <Input
                  value={newProduct.productName}
                  onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                  placeholder="상품명"
                />
              </div>
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Input
                  list="shop-panel-categories"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="카테고리 선택 또는 입력"
                />
                <datalist id="shop-panel-categories">
                  {(meta?.categories ?? []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>브랜드 (선택)</Label>
                  <Input
                    list="shop-panel-brands"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="브랜드 선택 또는 입력"
                  />
                  <datalist id="shop-panel-brands">
                    {(meta?.brands ?? []).map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>가격</Label>
                  <Input
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0"
                    type="number"
                  />
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newProduct.productName || !newProduct.category}
                className="w-full"
              >
                {isCreating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    등록된 상품이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                (products ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.id}</TableCell>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.brand ?? "-"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{p.price.toLocaleString()}원</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ── Shops Tab ─────────────────────────────────────────────────────────────────

function ShopsTab() {
  const { data: shops, mutate, isLoading } = useSWR<Shop[]>("/api/shops", fetcher)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [newShop, setNewShop] = useState({ name: "", category: "", description: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const shopCategories = [...new Set((shops ?? []).map(s => s.category).filter(Boolean))].sort()

  if (selectedShop) {
    return <ShopProductsPanel shop={selectedShop} onBack={() => setSelectedShop(null)} />
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShop),
      })
      const createdName = newShop.name
      setNewShop({ name: "", category: "", description: "" })
      setDialogOpen(false)
      await mutate()
      toast.success(`"${createdName}" 가게 등록 완료`)
    } catch (err) {
      toast.error("가게 등록 실패", { description: err instanceof Error ? err.message : undefined })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    try {
      await fetch(`/api/shops/${id}`, { method: "DELETE" })
      await mutate()
      toast.success("가게 삭제 완료")
    } catch {
      toast.error("가게 삭제 실패")
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("type", "shops")
      await fetch("/api/admin/import", { method: "POST", body: form })
      await mutate()
    } finally {
      setIsImporting(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">총 {shops?.length ?? 0}개 가게</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isImporting} asChild>
            <label className="cursor-pointer">
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              CSV 임포트
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                가게 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 가게 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>가게 이름</Label>
                  <Input
                    value={newShop.name}
                    onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                    placeholder="가게 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Input
                    list="shop-categories"
                    value={newShop.category}
                    onChange={(e) => setNewShop({ ...newShop, category: e.target.value })}
                    placeholder="카테고리 선택 또는 입력"
                  />
                  <datalist id="shop-categories">
                    {shopCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>설명 (선택)</Label>
                  <Input
                    value={newShop.description}
                    onChange={(e) => setNewShop({ ...newShop, description: e.target.value })}
                    placeholder="가게 설명"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newShop.name || !newShop.category}
                  className="w-full"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  추가
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(shops ?? []).map((shop) => (
                <TableRow
                  key={shop.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelectedShop(shop)}
                >
                  <TableCell className="font-mono text-sm">{shop.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{shop.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 inline ml-1 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{shop.category}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(shop.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ── Products Tab (전체 상품) ───────────────────────────────────────────────────

function ProductsTab() {
  const { data: products, mutate, isLoading } = useSWR<Product[]>("/api/products", fetcher)
  const { data: shops } = useSWR<Shop[]>("/api/shops", fetcher)
  const { data: meta } = useSWR<{ categories: string[]; brands: string[] }>("/api/products/meta", fetcher)
  const [newProduct, setNewProduct] = useState({ shopId: "", productName: "", category: "", brand: "", price: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: Number(newProduct.shopId),
          productName: newProduct.productName,
          category: newProduct.category,
          brand: newProduct.brand || undefined,
          price: Number(newProduct.price) || 0,
        }),
      })
      setNewProduct({ shopId: "", productName: "", category: "", brand: "", price: "" })
      setDialogOpen(false)
      await mutate()
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    await mutate()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("type", "products")
      await fetch("/api/admin/import", { method: "POST", body: form })
      await mutate()
    } finally {
      setIsImporting(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">총 {products?.length ?? 0}개 상품</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isImporting} asChild>
            <label className="cursor-pointer">
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              CSV 임포트
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                상품 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 상품 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>가게</Label>
                    <select
                      value={newProduct.shopId}
                      onChange={(e) => setNewProduct({ ...newProduct, shopId: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">가게 선택</option>
                      {(shops ?? []).map((shop) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} ({shop.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>카테고리</Label>
                    <Input
                      list="products-tab-categories"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="카테고리 선택 또는 입력"
                    />
                    <datalist id="products-tab-categories">
                      {(meta?.categories ?? []).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>상품명</Label>
                  <Input
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
                    placeholder="상품명"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>브랜드 (선택)</Label>
                    <Input
                      list="products-tab-brands"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="브랜드 선택 또는 입력"
                    />
                    <datalist id="products-tab-brands">
                      {(meta?.brands ?? []).map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>가격</Label>
                    <Input
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0"
                      type="number"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newProduct.shopId || !newProduct.productName || !newProduct.category}
                  className="w-full"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  추가
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>상품명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.id}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{p.price.toLocaleString()}원</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ── CommerceAdmin ─────────────────────────────────────────────────────────────

export function CommerceAdmin() {
  return (
    <Tabs defaultValue="shops">
      <TabsList>
        <TabsTrigger value="shops">가게 관리</TabsTrigger>
        <TabsTrigger value="products">전체 상품</TabsTrigger>
      </TabsList>
      <TabsContent value="shops" className="mt-4">
        <ShopsTab />
      </TabsContent>
      <TabsContent value="products" className="mt-4">
        <ProductsTab />
      </TabsContent>
    </Tabs>
  )
}
