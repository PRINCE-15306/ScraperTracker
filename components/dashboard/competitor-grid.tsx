"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useState, useEffect } from "react"
import { AddCompetitorDialog } from "./add-competitor-dialog"

interface CompetitorGridProps {
  competitors: any[]
  addCompetitorUrl?: string
}

export function CompetitorGrid({ competitors, addCompetitorUrl }: CompetitorGridProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [configuringId, setConfiguringId] = useState<string | null>(null)
  const [prefilledUrl, setPrefilledUrl] = useState<string>("")

  useEffect(() => {
    if (addCompetitorUrl) {
      setPrefilledUrl(addCompetitorUrl)
      setShowAddDialog(true)
    }
  }, [addCompetitorUrl])

  const handleConfigure = async (competitorId: string) => {
    setConfiguringId(competitorId)
    try {
      window.location.href = `/dashboard/competitors/${competitorId}/configure`
    } catch (error) {
      console.error("Configuration navigation failed:", error)
    } finally {
      setConfiguringId(null)
    }
  }

  if (competitors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No competitors yet</h3>
          <p className="text-slate-600 text-center mb-6 max-w-sm">
            Start tracking your competitors by adding their websites, changelogs, and social media accounts.
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 smooth-transition">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Your First Competitor
          </Button>
          <AddCompetitorDialog open={showAddDialog} onOpenChange={setShowAddDialog} prefilledUrl={prefilledUrl} />
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Your Competitors</h2>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 smooth-transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Competitor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="hover:shadow-lg smooth-transition">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    {competitor.logo_url ? (
                      <img
                        src={competitor.logo_url || "/placeholder.svg"}
                        alt={competitor.name}
                        className="w-8 h-8 rounded"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">{competitor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <p className="text-sm text-slate-500">{competitor.industry}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {competitor.description || "No description provided"}
              </p>
              <div className="flex items-center justify-between">
                <a
                  href={competitor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-500 flex items-center smooth-transition"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Visit Website
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigure(competitor.id)}
                  disabled={configuringId === competitor.id}
                  className="smooth-transition focus-visible"
                >
                  {configuringId === competitor.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-1" />
                      Loading...
                    </>
                  ) : (
                    "Configure"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddCompetitorDialog open={showAddDialog} onOpenChange={setShowAddDialog} prefilledUrl={prefilledUrl} />
    </div>
  )
}
