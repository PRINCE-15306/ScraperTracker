"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Globe, DollarSign, Tag, Percent, MousePointer, List } from "lucide-react"
import type { ScrapedData } from "@/lib/scraper/enhanced-scraper"

export function EnhancedScrapingDemo() {
  const [url, setUrl] = useState("https://stripe.com/pricing")
  const [loading, setLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runEnhancedDemo = async () => {
    if (!url) return

    setLoading(true)
    setError(null)
    setScrapedData(null)

    try {
      console.log("[v0] Starting enhanced demo for:", url)

      // First add competitor
      const competitorResponse = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: new URL(url).hostname,
          website_url: url,
          description: `Enhanced scraping demo for ${new URL(url).hostname}`,
          industry: "Technology",
        }),
      })

      if (!competitorResponse.ok) {
        throw new Error(`Failed to add competitor: ${competitorResponse.status}`)
      }

      const { competitor } = await competitorResponse.json()
      console.log("[v0] Competitor added:", competitor)

      // Enhanced scraping
      const scrapeResponse = await fetch("/api/scrape-enhanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorId: competitor.id,
          url: url,
        }),
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json()
        throw new Error(`Enhanced scraping failed: ${errorData.error}`)
      }

      const result = await scrapeResponse.json()
      console.log("[v0] Enhanced scraping result:", result)

      setScrapedData(result.data)
    } catch (err) {
      console.error("[v0] Enhanced demo error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Enhanced Competitor Scraping Demo
          </CardTitle>
          <CardDescription>
            Advanced scraping that detects pricing, coupons, discounts, features, and buttons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter competitor website URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={runEnhancedDemo} disabled={loading || !url}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                "Start Enhanced Scraping"
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {scrapedData && (
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Scraping Results</CardTitle>
            <CardDescription>Scraped from: {scrapedData.metadata.url}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="coupons">Coupons</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{scrapedData.pricing.length}</div>
                      <div className="text-sm text-muted-foreground">Pricing Items</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Tag className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{scrapedData.coupons.length}</div>
                      <div className="text-sm text-muted-foreground">Coupons</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Percent className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold">{scrapedData.discounts.length}</div>
                      <div className="text-sm text-muted-foreground">Discounts</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MousePointer className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{scrapedData.buttons.length}</div>
                      <div className="text-sm text-muted-foreground">Action Buttons</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Website Overview</h3>
                  <p>
                    <strong>Title:</strong> {scrapedData.title}
                  </p>
                  <p>
                    <strong>Description:</strong> {scrapedData.description}
                  </p>
                  <p>
                    <strong>Word Count:</strong> {scrapedData.metadata.wordCount.toLocaleString()}
                  </p>
                  <p>
                    <strong>Images:</strong> {scrapedData.metadata.imageCount}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                {scrapedData.pricing.length > 0 ? (
                  <div className="grid gap-4">
                    {scrapedData.pricing.map((price, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-lg">{price.price}</div>
                              <div className="text-sm text-muted-foreground">
                                {price.plan} {price.period && `• ${price.period}`}
                              </div>
                            </div>
                            <Badge variant="outline">{price.currency}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No pricing information detected</p>
                )}
              </TabsContent>

              <TabsContent value="coupons" className="space-y-4">
                {scrapedData.coupons.length > 0 ? (
                  <div className="grid gap-4">
                    {scrapedData.coupons.map((coupon, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono font-semibold">{coupon.code}</div>
                              <div className="text-sm text-muted-foreground">{coupon.description}</div>
                            </div>
                            <Badge variant="secondary">{coupon.discount}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No coupon codes detected</p>
                )}
              </TabsContent>

              <TabsContent value="discounts" className="space-y-4">
                {scrapedData.discounts.length > 0 ? (
                  <div className="grid gap-4">
                    {scrapedData.discounts.map((discount, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{discount.text}</div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{discount.type}</Badge>
                              {discount.percentage && <Badge variant="secondary">{discount.percentage}%</Badge>}
                              {discount.amount && <Badge variant="secondary">${discount.amount}</Badge>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No discounts detected</p>
                )}
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                {scrapedData.features.length > 0 ? (
                  <div className="grid gap-2">
                    {scrapedData.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded border">
                        <List className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No features detected</p>
                )}
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4">
                {scrapedData.buttons.length > 0 ? (
                  <div className="grid gap-4">
                    {scrapedData.buttons.map((button, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{button.text}</div>
                              {button.href && (
                                <div className="text-xs text-muted-foreground truncate max-w-xs">{button.href}</div>
                              )}
                            </div>
                            <Badge variant="outline">{button.type}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No action buttons detected</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
