"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WeeklySummaryProps {
  weekStartDate?: string
}

interface Summary {
  id: string
  week_start_date: string
  week_end_date: string
  summary_content: {
    overview: string
    totalChanges: number
    importantChanges: number
    competitorBreakdown: Record<string, any>
    keyInsights: Array<{
      insight: string
      impact: string
      competitors: string[]
    }>
    recommendations: Array<{
      action: string
      priority: string
      reasoning: string
      competitors: string[]
    }>
    trendAnalysis: {
      emergingPatterns: string[]
      marketDirection: string
      competitiveGaps: string[]
    }
  }
  total_changes: number
  important_changes: number
  created_at: string
  is_sent?: boolean
  sent_at?: string
}

export function WeeklySummary({ weekStartDate }: WeeklySummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const currentWeekStart = weekStartDate || getCurrentWeekStart()

  useEffect(() => {
    fetchSummary()
  }, [currentWeekStart])

  const fetchSummary = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/summaries")
      const data = await response.json()
      if (data.summaries && data.summaries.length > 0) {
        // Find summary for current week or get the most recent
        const currentSummary =
          data.summaries.find((s: Summary) => s.week_start_date === currentWeekStart) || data.summaries[0]
        setSummary(currentSummary)
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSummary = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/summaries/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: currentWeekStart }),
      })

      const data = await response.json()
      if (data.success) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error generating summary:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const sendSummary = async () => {
    if (!summary) return

    setIsSending(true)
    try {
      const response = await fetch("/api/integrations/send-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryId: summary.id }),
      })

      const data = await response.json()
      if (data.success) {
        // Update summary state to reflect it was sent
        setSummary({ ...summary, is_sent: true, sent_at: new Date().toISOString() })
        alert("Summary sent successfully to configured integrations!")
      } else {
        alert("Failed to send summary")
      }
    } catch (error) {
      console.error("Error sending summary:", error)
      alert("Error sending summary")
    } finally {
      setIsSending(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  if (isLoading) {
    return <div>Loading weekly summary...</div>
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Summary Available</h3>
          <p className="text-slate-600 mb-6">Generate your first weekly competitive intelligence summary.</p>
          <Button onClick={generateSummary} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
            {isGenerating ? "Generating..." : "Generate Weekly Summary"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Summary</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">
                {new Date(summary.week_start_date).toLocaleDateString()} -{" "}
                {new Date(summary.week_end_date).toLocaleDateString()}
              </span>
              <Button onClick={sendSummary} disabled={isSending} size="sm" variant="outline">
                {isSending ? "Sending..." : "Send to Integrations"}
              </Button>
              <Button onClick={generateSummary} disabled={isGenerating} size="sm" variant="outline">
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </div>
          {summary.is_sent && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sent to integrations on {new Date(summary.sent_at).toLocaleString()}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{summary.summary_content.totalChanges}</div>
              <div className="text-sm text-slate-600">Total Changes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{summary.summary_content.importantChanges}</div>
              <div className="text-sm text-orange-600">Important Changes</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {Object.keys(summary.summary_content.competitorBreakdown).length}
              </div>
              <div className="text-sm text-blue-600">Active Competitors</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Executive Overview</h3>
            <p className="text-slate-700 leading-relaxed">{summary.summary_content.overview}</p>
          </div>

          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="competitors">Competitors</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              {summary.summary_content.keyInsights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className={getPriorityColor(insight.impact)}>
                      {insight.impact.toUpperCase()} IMPACT
                    </Badge>
                  </div>
                  <p className="text-slate-900 mb-2">{insight.insight}</p>
                  <div className="flex flex-wrap gap-1">
                    {insight.competitors.map((competitor) => (
                      <Badge key={competitor} variant="outline" className="text-xs">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {summary.summary_content.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className={getPriorityColor(rec.priority)}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                  <h4 className="font-medium text-slate-900 mb-2">{rec.action}</h4>
                  <p className="text-sm text-slate-600 mb-3">{rec.reasoning}</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.competitors.map((competitor) => (
                      <Badge key={competitor} variant="outline" className="text-xs">
                        {competitor}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              {Object.entries(summary.summary_content.competitorBreakdown).map(([name, data]) => (
                <div key={name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900">{name}</h4>
                    <Badge variant="secondary" className={getRiskColor(data.riskLevel)}>
                      {data.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-slate-500">Total Changes:</span>
                      <span className="ml-2 font-medium">{data.changesCount}</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500">Important:</span>
                      <span className="ml-2 font-medium">{data.importantChanges}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 block mb-2">Key Changes:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {data.keyChanges.map((change: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Market Direction</h4>
                <p className="text-slate-700">
                  {summary.summary_content.trendAnalysis?.marketDirection || "No market direction analysis available."}
                </p>
              </div>

              {summary.summary_content.trendAnalysis?.emergingPatterns?.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Emerging Patterns</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {summary.summary_content.trendAnalysis.emergingPatterns.map((pattern, index) => (
                      <li key={index} className="text-slate-700">
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.summary_content.trendAnalysis?.competitiveGaps?.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Competitive Opportunities</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {summary.summary_content.trendAnalysis.competitiveGaps.map((gap, index) => (
                      <li key={index} className="text-slate-700">
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function getCurrentWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek
  const weekStart = new Date(now.setDate(diff))
  return weekStart.toISOString().split("T")[0]
}
