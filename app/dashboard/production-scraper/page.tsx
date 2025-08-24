"use client"

import { TableHeader } from "@/components/ui/table"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  Download,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Brain,
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface ScrapedData {
  title: string
  description: string
  pricing: PricingItem[]
  coupons: CouponItem[]
  discounts: DiscountItem[]
  features: FeatureItem[]
  buttons: ButtonItem[]
  metadata: {
    url: string
    scrapedAt: string
    pagesScraped: number
    processingTime: number
  }
}

interface PricingItem {
  price: string
  plan: string
  features: string[]
  billing: string
  category: "subscription" | "one-time" | "usage-based" | "freemium" | "enterprise"
  confidence: number
}

interface CouponItem {
  code: string
  description: string
  discount: string
  expiry?: string
  confidence: number
}

interface DiscountItem {
  text: string
  percentage: string
  type: "percentage" | "fixed" | "bogo" | "free-trial"
  conditions?: string
  confidence: number
}

interface FeatureItem {
  text: string
  category: "core" | "premium" | "enterprise" | "addon"
  confidence: number
}

interface ButtonItem {
  text: string
  type: "cta" | "signup" | "trial" | "purchase" | "contact"
  url?: string
  confidence: number
}

export default function ProductionScraperPage() {
  const [url, setUrl] = useState("https://stripe.com/pricing")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [intelligentAnalysis, setIntelligentAnalysis] = useState<any>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      chartData?: any
      tableData?: any
    }>
  >([])
  const [chatInput, setChatInput] = useState("")
  const [learningStats, setLearningStats] = useState<any>(null)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleScrape = async () => {
    if (!url.trim()) return

    setLoading(true)
    setScrapedData(null)
    setAnalysis("")
    setLogs([])
    setProgress(0)

    try {
      addLog(`Starting advanced scrape for: ${url}`)
      setProgress(20)

      const response = await fetch("/api/advanced-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })

      setProgress(60)
      addLog("Processing scraped content...")

      const result = await response.json()

      if (result.success) {
        setScrapedData(result.data)
        setProgress(100)
        addLog(`Scraping completed successfully!`)
        addLog(
          `Found: ${result.data.pricing.length} pricing, ${result.data.coupons.length} coupons, ${result.data.discounts.length} discounts`,
        )
      } else {
        addLog(`Scraping failed: ${result.error}`)
        alert(`Scraping failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`Error: ${error}`)
      alert("Scraping failed. Please try again.")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const handleIntelligentAnalyze = async () => {
    if (!scrapedData) return

    setAnalyzing(true)
    addLog("Starting intelligent AI analysis with learning capabilities...")

    try {
      const response = await fetch("/api/intelligent-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: scrapedData,
          includeWebVerification: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIntelligentAnalysis(result.analysis)
        setVerificationResult(result.verification)
        setLearningStats(result.learningStats)
        addLog("Intelligent analysis completed with web verification")

        // Add analysis to chat
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've completed an intelligent analysis of ${new URL(scrapedData.metadata.url).hostname}. Here are the key insights:\n\n${result.analysis.insights.slice(0, 3).join("\n")}\n\nWould you like me to elaborate on any specific aspect?`,
          },
        ])
      } else {
        addLog(`Analysis failed: ${result.error}`)
        alert(`Analysis failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`Analysis error: ${error}`)
      setIntelligentAnalysis({ analysis: "Analysis failed. Please try again." })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !scrapedData) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])

    try {
      const response = await fetch("/api/chat-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          scrapedData: scrapedData,
          previousAnalysis: intelligentAnalysis,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.response,
            chartData: result.chartData,
            tableData: result.tableData,
          },
        ])
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble processing your request. Please try again." },
      ])
    }
  }

  const provideFeedback = async (type: "positive" | "negative") => {
    if (!intelligentAnalysis) return

    try {
      const response = await fetch("/api/analysis-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: intelligentAnalysis.id || Date.now().toString(),
          feedback: type,
          accuracyScore: type === "positive" ? 0.9 : 0.3,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        addLog(`Feedback provided: ${type}. This helps improve future analyses.`)

        if (result.learningStats) {
          setLearningStats(result.learningStats)
        }

        const feedbackButton = document.querySelector(`[data-feedback="${type}"]`)
        if (feedbackButton) {
          feedbackButton.classList.add("bg-green-100", "border-green-500")
          setTimeout(() => {
            feedbackButton.classList.remove("bg-green-100", "border-green-500")
          }, 2000)
        }
      }
    } catch (error) {
      console.error("Failed to provide feedback:", error)
      addLog(`Failed to provide feedback: ${error}`)
    }
  }

  const exportToCSV = () => {
    if (!scrapedData) return

    const csvData = [
      ["Type", "Item", "Details", "Category", "Confidence"],
      ...scrapedData.pricing.map((p) => ["Pricing", p.plan, p.price, p.category, p.confidence.toString()]),
      ...scrapedData.coupons.map((c) => ["Coupon", c.code, c.discount, "coupon", c.confidence.toString()]),
      ...scrapedData.discounts.map((d) => ["Discount", d.text, d.percentage, d.type, d.confidence.toString()]),
      ...scrapedData.features.map((f) => ["Feature", f.text, "", f.category, f.confidence.toString()]),
      ...scrapedData.buttons.map((b) => ["Button", b.text, b.url || "", b.type, b.confidence.toString()]),
    ]

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `competitor-analysis-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getChartData = () => {
    if (!scrapedData) return { categoryData: [], confidenceData: [], pricingData: [] }

    const categoryData = [
      { name: "Pricing", value: scrapedData.pricing.length, color: "#3b82f6" },
      { name: "Coupons", value: scrapedData.coupons.length, color: "#10b981" },
      { name: "Discounts", value: scrapedData.discounts.length, color: "#f59e0b" },
      { name: "Features", value: scrapedData.features.length, color: "#8b5cf6" },
      { name: "Buttons", value: scrapedData.buttons.length, color: "#6366f1" },
    ]

    const confidenceData = [
      {
        name: "High (>80%)",
        value: [
          ...scrapedData.pricing,
          ...scrapedData.coupons,
          ...scrapedData.discounts,
          ...scrapedData.features,
          ...scrapedData.buttons,
        ].filter((item) => item.confidence > 0.8).length,
      },
      {
        name: "Medium (50-80%)",
        value: [
          ...scrapedData.pricing,
          ...scrapedData.coupons,
          ...scrapedData.discounts,
          ...scrapedData.features,
          ...scrapedData.buttons,
        ].filter((item) => item.confidence >= 0.5 && item.confidence <= 0.8).length,
      },
      {
        name: "Low (<50%)",
        value: [
          ...scrapedData.pricing,
          ...scrapedData.coupons,
          ...scrapedData.discounts,
          ...scrapedData.features,
          ...scrapedData.buttons,
        ].filter((item) => item.confidence < 0.5).length,
      },
    ]

    const pricingData = scrapedData.pricing.map((p) => ({
      plan: p.plan,
      price: Number.parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0,
      confidence: Math.round(p.confidence * 100),
    }))

    return { categoryData, confidenceData, pricingData }
  }

  const { categoryData, confidenceData, pricingData } = getChartData()

  const ChatChart = ({ chartData }: { chartData: any }) => {
    if (!chartData) return null

    const chartConfig = chartData.data.reduce((acc: any, item: any, index: number) => {
      const key = item.plan || item.name || `item-${index}`
      acc[key] = {
        label: item.plan || item.name || key,
        color: item.color || `hsl(${index * 60}, 70%, 50%)`,
      }
      return acc
    }, {})

    return (
      <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Chart failed to load</div>}>
        <div className="mt-4 p-4 border rounded-lg bg-white">
          <h4 className="font-medium mb-3">{chartData.title}</h4>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.type === "bar" ? (
                <BarChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="price" fill="#3b82f6" />
                </BarChart>
              ) : chartData.type === "pie" ? (
                <PieChart>
                  <Pie data={chartData.data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                    {chartData.data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              ) : chartData.type === "line" ? (
                <LineChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                </LineChart>
              ) : null}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </ErrorBoundary>
    )
  }

  const ChatTable = ({ tableData }: { tableData: any }) => {
    if (!tableData) return null

    return (
      <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Table failed to load</div>}>
        <div className="mt-4 p-4 border rounded-lg bg-white">
          <h4 className="font-medium mb-3">{tableData.title}</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableData.headers.map((header: string, index: number) => (
                    <TableHead key={index}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.rows.map((row: string[], rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Intelligent Competitor Analysis</h1>
            <p className="text-muted-foreground">AI-powered scraping with learning capabilities and web verification</p>
          </div>
          <div className="flex gap-2">
            {scrapedData && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2 bg-transparent smooth-transition"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            {learningStats && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Learning Score: {(learningStats.learningScore * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Intelligent Scraping Configuration
                </CardTitle>
                <CardDescription>AI-powered competitor analysis with learning capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://competitor.com/pricing"
                    className="mt-1 smooth-transition focus-visible"
                  />
                </div>

                {loading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Intelligent Scraping Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoadingSpinner size="sm" />
                      <span>Processing competitor data...</span>
                    </div>
                  </div>
                )}

                <Button onClick={handleScrape} disabled={loading} className="w-full smooth-transition">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Scraping...
                    </>
                  ) : (
                    "Start Intelligent Scrape"
                  )}
                </Button>

                {learningStats && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{learningStats.totalAnalyses}</div>
                      <div className="text-xs text-muted-foreground">Total Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(learningStats.successRate * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Real-time Intelligence Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-48 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Waiting for intelligent scraping to start...
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1 animate-in fade-in duration-200">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {scrapedData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Data Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Confidence Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {verificationResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={verificationResult.verified ? "default" : "destructive"}>
                          {verificationResult.verified ? "Verified" : "Needs Review"}
                        </Badge>
                        <span className="text-sm">{(verificationResult.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {verificationResult.discrepancies.length} discrepancies found
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {verificationResult.additionalFindings.length} additional insights
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Run intelligent analysis for verification</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intelligence Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Processing Time:</span>
                      <span className="text-sm font-medium">{scrapedData.metadata.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pages Analyzed:</span>
                      <span className="text-sm font-medium">{scrapedData.metadata.pagesScraped}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">AI Confidence:</span>
                      <span className="text-sm font-medium">
                        {intelligentAnalysis ? `${(intelligentAnalysis.confidence * 100).toFixed(0)}%` : "Pending"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {pricingData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Analysis</CardTitle>
                  <CardDescription>Visual comparison of competitor pricing plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pricingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="plan" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="price" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="pricing" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="coupons">Coupons</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="buttons">Buttons</TabsTrigger>
                <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-4">
                {scrapedData.pricing.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scrapedData.pricing.map((pricing, index) => (
                      <Card key={index} className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{pricing.plan}</CardTitle>
                            <Badge variant={pricing.category === "enterprise" ? "default" : "secondary"}>
                              {pricing.category}
                            </Badge>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{pricing.price}</span>
                            <span className="text-sm text-muted-foreground">/{pricing.billing}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Confidence:</span>
                              <Badge variant="outline">{Math.round(pricing.confidence * 100)}%</Badge>
                            </div>
                            {pricing.features.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-1">Features:</p>
                                <ul className="text-xs space-y-1">
                                  {pricing.features.slice(0, 3).map((feature, i) => (
                                    <li key={i} className="text-muted-foreground">
                                      • {feature}
                                    </li>
                                  ))}
                                  {pricing.features.length > 3 && (
                                    <li className="text-xs text-muted-foreground">
                                      +{pricing.features.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No pricing information found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="coupons" className="space-y-4">
                {scrapedData.coupons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scrapedData.coupons.map((coupon, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Badge variant="secondary">{coupon.code}</Badge>
                            <span className="text-green-600">{coupon.discount}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{coupon.description}</p>
                          {coupon.expiry && (
                            <p className="text-xs text-muted-foreground mt-2">Expiry: {coupon.expiry}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No coupon codes found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="discounts" className="space-y-4">
                {scrapedData.discounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scrapedData.discounts.map((discount, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{discount.text}</CardTitle>
                            <Badge variant="outline">{discount.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {discount.percentage && (
                              <p className="text-sm">
                                <strong>Discount:</strong> {discount.percentage}%
                              </p>
                            )}
                            {discount.amount && (
                              <p className="text-sm">
                                <strong>Amount:</strong> ${discount.amount}
                              </p>
                            )}
                            {discount.conditions && (
                              <p className="text-sm text-muted-foreground mt-2">Conditions: {discount.conditions}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No discounts found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                {scrapedData.features.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scrapedData.features.map((feature, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <p className="text-sm flex-1">{feature.text}</p>
                            <Badge variant="outline" className="ml-2">
                              {feature.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No features found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4">
                {scrapedData.buttons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scrapedData.buttons.map((button, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{button.text}</p>
                            <Badge variant="outline">{button.type}</Badge>
                          </div>
                          {button.url && <p className="text-xs text-muted-foreground mt-1 truncate">{button.url}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No buttons found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="intelligence" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Intelligent Competitive Analysis
                    </CardTitle>
                    <CardDescription>
                      AI-powered insights with web verification and learning capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Button
                        onClick={handleIntelligentAnalyze}
                        disabled={analyzing}
                        className="flex items-center gap-2"
                      >
                        <Brain className="h-4 w-4" />
                        {analyzing ? "Analyzing..." : "Generate Intelligent Analysis"}
                      </Button>

                      {intelligentAnalysis && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => provideFeedback("positive")}
                            className="flex items-center gap-1 transition-colors"
                            data-feedback="positive"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            Good
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => provideFeedback("negative")}
                            className="flex items-center gap-1 transition-colors"
                            data-feedback="negative"
                          >
                            <ThumbsDown className="h-3 w-3" />
                            Improve
                          </Button>
                        </div>
                      )}
                    </div>

                    {intelligentAnalysis && (
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm">{intelligentAnalysis.analysis}</pre>
                        </div>

                        {verificationResult && verificationResult.additionalFindings.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Web Verification Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {verificationResult.additionalFindings.map((finding: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Search className="h-4 w-4 mt-0.5 text-blue-500" />
                                    <span className="text-sm">{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Enhanced AI Analysis Chat
                    </CardTitle>
                    <CardDescription>
                      Interactive conversation with charts, tables, and enhanced typography
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-muted/20">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Start a conversation with the AI analyst</p>
                            <p className="text-sm mt-2">
                              Ask about pricing strategies, competitive positioning, or request charts and tables
                            </p>
                            <div className="mt-4 text-xs space-y-1">
                              <p>💬 "Show me their pricing strategy"</p>
                              <p>📊 "Create a chart of their features"</p>
                              <p>📋 "Make a table comparing their plans"</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {chatMessages.map((message, index) => (
                              <div
                                key={index}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                              >
                                <div
                                  className={`max-w-[85%] p-4 rounded-lg smooth-transition ${
                                    message.role === "user" ? "bg-blue-500 text-white" : "bg-white border shadow-sm"
                                  }`}
                                >
                                  <div
                                    className={`whitespace-pre-wrap text-sm leading-relaxed ai-chat-response ${
                                      message.role === "assistant" ? "font-inter" : ""
                                    }`}
                                  >
                                    {message.content}
                                  </div>
                                  {message.chartData && <ChatChart chartData={message.chartData} />}
                                  {message.tableData && <ChatTable tableData={message.tableData} />}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask about competitor strategies, request charts/tables, or analyze specific insights..."
                          className="flex-1 font-inter smooth-transition focus-visible resize-none"
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleChatSubmit()
                            }
                          }}
                        />
                        <Button onClick={handleChatSubmit} disabled={!chatInput.trim()} className="smooth-transition">
                          Send
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>💡 Try:</span>
                        <button
                          onClick={() => setChatInput("Show me a pricing comparison chart")}
                          className="px-2 py-1 bg-muted rounded hover:bg-muted/80 smooth-transition focus-visible"
                        >
                          "Show me a pricing comparison chart"
                        </button>
                        <button
                          onClick={() => setChatInput("Create a feature breakdown table")}
                          className="px-2 py-1 bg-muted rounded hover:bg-muted/80 smooth-transition focus-visible"
                        >
                          "Create a feature breakdown table"
                        </button>
                        <button
                          onClick={() => setChatInput("Analyze their competitive strategy")}
                          className="px-2 py-1 bg-muted rounded hover:bg-muted/80 smooth-transition focus-visible"
                        >
                          "Analyze their competitive strategy"
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
