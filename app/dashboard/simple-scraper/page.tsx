"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, Zap, DollarSign, Tag, Star, MousePointer } from "lucide-react"

interface ScrapedData {
  url: string
  title: string
  description: string
  pricing: Array<{
    text: string
    price: string
    context: string
  }>
  coupons: Array<{
    code: string
    text: string
    context: string
  }>
  discounts: Array<{
    text: string
    percentage: string
    context: string
  }>
  features: string[]
  buttons: Array<{
    text: string
    type: string
    context: string
  }>
  headings: string[]
  metadata: {
    scrapedAt: string
    totalElements: number
  }
}

export default function SimpleScraperPage() {
  const [url, setUrl] = useState("https://stripe.com/pricing")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScrape = async () => {
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setScrapedData(null)
    setAnalysis(null)

    try {
      console.log("[v0] Starting simple scrape for:", url)

      const response = await fetch("/api/simple-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Scrape successful:", data)
      setScrapedData(data)
    } catch (err) {
      console.error("[v0] Scrape error:", err)
      setError(err instanceof Error ? err.message : "Scraping failed")
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!scrapedData) return

    setAnalyzing(true)
    setError(null)

    try {
      console.log("[v0] Starting AI analysis")

      const response = await fetch("/api/analyze-scraped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scrapedData }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Analysis complete:", result)
      setAnalysis(result.analysis)
    } catch (err) {
      console.error("[v0] Analysis error:", err)
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simple Web Scraper</h1>
        <p className="text-muted-foreground">Scrape any website to extract pricing, features, coupons, and more</p>
      </div>

      {/* Scraping Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Scrape Website
          </CardTitle>
          <CardDescription>Enter any website URL to extract key information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && !loading && handleScrape()}
            />
            <Button onClick={handleScrape} disabled={loading || !url.trim()} className="min-w-[120px]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scrape
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Scraped Data Display */}
      {scrapedData && (
        <div className="space-y-6">
          {/* Header with Analyze Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{scrapedData.title}</h2>
              <p className="text-muted-foreground">{scrapedData.url}</p>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              variant="outline"
              className="min-w-[140px] bg-transparent"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  AI Analyze
                </>
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{scrapedData.pricing.length}</p>
                    <p className="text-xs text-muted-foreground">Pricing Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{scrapedData.coupons.length}</p>
                    <p className="text-xs text-muted-foreground">Coupons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Badge className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{scrapedData.discounts.length}</p>
                    <p className="text-xs text-muted-foreground">Discounts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{scrapedData.features.length}</p>
                    <p className="text-xs text-muted-foreground">Features</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{scrapedData.buttons.length}</p>
                    <p className="text-xs text-muted-foreground">Action Buttons</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Data Tabs */}
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="discounts">Discounts</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                  <CardDescription>Found {scrapedData.pricing.length} pricing-related items</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapedData.pricing.length > 0 ? (
                    <div className="space-y-3">
                      {scrapedData.pricing.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg text-green-600">{item.price}</span>
                            <Badge variant="outline">{item.context}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No pricing information found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Coupon Codes</CardTitle>
                  <CardDescription>Found {scrapedData.coupons.length} coupon codes</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapedData.coupons.length > 0 ? (
                    <div className="space-y-3">
                      {scrapedData.coupons.map((coupon, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <code className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono">
                              {coupon.code}
                            </code>
                            <Badge variant="outline">{coupon.context}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{coupon.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No coupon codes found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Discount Offers</CardTitle>
                  <CardDescription>Found {scrapedData.discounts.length} discount offers</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapedData.discounts.length > 0 ? (
                    <div className="space-y-3">
                      {scrapedData.discounts.map((discount, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-lg text-red-600">{discount.percentage}</span>
                            <Badge variant="outline">{discount.context}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{discount.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No discount offers found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>Found {scrapedData.features.length} feature mentions</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapedData.features.length > 0 ? (
                    <div className="grid gap-2">
                      {scrapedData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No features found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Action Buttons</CardTitle>
                  <CardDescription>Found {scrapedData.buttons.length} action buttons</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapedData.buttons.length > 0 ? (
                    <div className="space-y-3">
                      {scrapedData.buttons.map((button, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{button.text}</span>
                            <div className="flex gap-2">
                              <Badge variant="outline">{button.type}</Badge>
                              <Badge variant="secondary">{button.context}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No action buttons found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Page Overview</CardTitle>
                  <CardDescription>General information about the scraped page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{scrapedData.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Main Headings</h4>
                    <div className="space-y-1">
                      {scrapedData.headings.slice(0, 10).map((heading, index) => (
                        <p key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                          {heading}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium">Scraped At</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scrapedData.metadata.scrapedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Elements</p>
                      <p className="text-sm text-muted-foreground">{scrapedData.metadata.totalElements}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* AI Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  AI Analysis
                </CardTitle>
                <CardDescription>Intelligent insights about the scraped content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">{analysis}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
