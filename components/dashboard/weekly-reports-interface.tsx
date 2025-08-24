"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Download, Search, TrendingUp, TrendingDown } from "lucide-react"

interface Summary {
  id: string
  week_start_date: string
  week_end_date: string
  summary_content: any
  total_changes: number
  important_changes: number
  is_sent: boolean
  sent_at: string | null
  created_at: string
}

interface Competitor {
  id: string
  name: string
  industry: string
}

interface WeeklyReportsInterfaceProps {
  summaries: Summary[]
  competitors: Competitor[]
}

export function WeeklyReportsInterface({ summaries, competitors }: WeeklyReportsInterfaceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [sortBy, setSortBy] = useState<"date" | "changes" | "importance">("date")
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null)

  // Filter and sort summaries
  const filteredSummaries = useMemo(() => {
    const filtered = summaries.filter((summary) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesOverview = summary.summary_content?.overview?.toLowerCase().includes(searchLower)
        const matchesInsights = summary.summary_content?.keyInsights?.some((insight: any) =>
          insight.insight.toLowerCase().includes(searchLower),
        )
        if (!matchesOverview && !matchesInsights) return false
      }

      // Date range filter
      if (dateRange.from) {
        const summaryDate = new Date(summary.week_start_date)
        if (summaryDate < dateRange.from) return false
      }
      if (dateRange.to) {
        const summaryDate = new Date(summary.week_start_date)
        if (summaryDate > dateRange.to) return false
      }

      // Competitor filter
      if (selectedCompetitor !== "all") {
        const hasCompetitor = Object.keys(summary.summary_content?.competitorBreakdown || {}).some((name) =>
          name.toLowerCase().includes(selectedCompetitor.toLowerCase()),
        )
        if (!hasCompetitor) return false
      }

      return true
    })

    // Sort summaries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "changes":
          return b.total_changes - a.total_changes
        case "importance":
          return b.important_changes - a.important_changes
        case "date":
        default:
          return new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime()
      }
    })

    return filtered
  }, [summaries, searchTerm, selectedCompetitor, dateRange, sortBy])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalReports = summaries.length
    const totalChanges = summaries.reduce((sum, s) => sum + s.total_changes, 0)
    const totalImportantChanges = summaries.reduce((sum, s) => sum + s.important_changes, 0)
    const avgChangesPerWeek = totalReports > 0 ? Math.round(totalChanges / totalReports) : 0
    const sentReports = summaries.filter((s) => s.is_sent).length

    // Trend analysis (compare last 4 weeks vs previous 4 weeks)
    const recent = summaries.slice(0, 4)
    const previous = summaries.slice(4, 8)
    const recentAvg = recent.length > 0 ? recent.reduce((sum, s) => sum + s.total_changes, 0) / recent.length : 0
    const previousAvg =
      previous.length > 0 ? previous.reduce((sum, s) => sum + s.total_changes, 0) / previous.length : 0
    const trend = recentAvg > previousAvg ? "up" : recentAvg < previousAvg ? "down" : "stable"

    return {
      totalReports,
      totalChanges,
      totalImportantChanges,
      avgChangesPerWeek,
      sentReports,
      trend,
      trendPercentage: previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0,
    }
  }, [summaries])

  const exportReport = async (summary: Summary, format: "json" | "csv") => {
    const filename = `competitive-report-${summary.week_start_date}.${format}`

    if (format === "json") {
      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "csv") {
      // Convert to CSV format
      const csvContent = convertSummaryToCSV(summary)
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const generateNewReport = async () => {
    try {
      const response = await fetch("/api/summaries/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate: getCurrentWeekStart() }),
      })

      if (response.ok) {
        window.location.reload() // Refresh to show new report
      }
    } catch (error) {
      console.error("Error generating report:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Reports</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalReports}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Changes</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalChanges}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Important Changes</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalImportantChanges}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Changes/Week</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.avgChangesPerWeek}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Activity Trend</p>
                <div className="flex items-center space-x-1">
                  <p className="text-2xl font-bold text-slate-900">{Math.abs(analytics.trendPercentage)}%</p>
                  {analytics.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : analytics.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <div className="w-4 h-4 bg-slate-400 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report Management</CardTitle>
            <Button onClick={generateNewReport} className="bg-blue-600 hover:bg-blue-700">
              Generate New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by competitor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Competitors</SelectItem>
                {competitors.map((competitor) => (
                  <SelectItem key={competitor.id} value={competitor.name}>
                    {competitor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest First)</SelectItem>
                <SelectItem value="changes">Total Changes</SelectItem>
                <SelectItem value="importance">Important Changes</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reports ({filteredSummaries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSummaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No reports match your current filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedSummary?.id === summary.id ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedSummary(summary)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-slate-900">
                            Week of {new Date(summary.week_start_date).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {new Date(summary.week_start_date).toLocaleDateString()} -{" "}
                            {new Date(summary.week_end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {summary.is_sent && <Badge className="bg-green-100 text-green-700">Sent</Badge>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              exportReport(summary, "json")
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Total Changes:</span>
                          <span className="ml-1 font-medium">{summary.total_changes}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Important:</span>
                          <span className="ml-1 font-medium">{summary.important_changes}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Competitors:</span>
                          <span className="ml-1 font-medium">
                            {Object.keys(summary.summary_content?.competitorBreakdown || {}).length}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {summary.summary_content?.overview || "No overview available"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Detail Panel */}
        <div>
          {selectedSummary ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Report Details</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(selectedSummary, "json")}
                      title="Export as JSON"
                    >
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportReport(selectedSummary, "csv")}
                      title="Export as CSV"
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Overview</h4>
                  <p className="text-sm text-slate-600">{selectedSummary.summary_content?.overview}</p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium">{selectedSummary.total_changes}</div>
                      <div className="text-slate-500">Total Changes</div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="font-medium">{selectedSummary.important_changes}</div>
                      <div className="text-slate-500">Important</div>
                    </div>
                  </div>
                </div>

                {selectedSummary.summary_content?.keyInsights?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Top Insights</h4>
                    <div className="space-y-2">
                      {selectedSummary.summary_content.keyInsights.slice(0, 3).map((insight: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-slate-50 rounded">
                          <div className="font-medium text-slate-900">{insight.insight}</div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {insight.impact.toUpperCase()} IMPACT
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSummary.summary_content?.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Top Recommendations</h4>
                    <div className="space-y-2">
                      {selectedSummary.summary_content.recommendations.slice(0, 3).map((rec: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-slate-50 rounded">
                          <div className="font-medium text-slate-900">{rec.action}</div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {rec.priority.toUpperCase()} PRIORITY
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs text-slate-500">
                    Generated: {new Date(selectedSummary.created_at).toLocaleString()}
                  </div>
                  {selectedSummary.is_sent && (
                    <div className="text-xs text-slate-500">
                      Sent: {new Date(selectedSummary.sent_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-500">Select a report to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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

function convertSummaryToCSV(summary: Summary): string {
  const headers = [
    "Week Start",
    "Week End",
    "Total Changes",
    "Important Changes",
    "Overview",
    "Key Insights",
    "Recommendations",
    "Created At",
    "Sent",
  ]

  const keyInsights = summary.summary_content?.keyInsights
    ?.map((insight: any) => `${insight.insight} (${insight.impact} impact)`)
    .join("; ")

  const recommendations = summary.summary_content?.recommendations
    ?.map((rec: any) => `${rec.action} (${rec.priority} priority)`)
    .join("; ")

  const row = [
    summary.week_start_date,
    summary.week_end_date,
    summary.total_changes,
    summary.important_changes,
    `"${summary.summary_content?.overview || ""}"`,
    `"${keyInsights || ""}"`,
    `"${recommendations || ""}"`,
    summary.created_at,
    summary.is_sent ? "Yes" : "No",
  ]

  return [headers.join(","), row.join(",")].join("\n")
}
