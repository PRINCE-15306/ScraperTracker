"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface MonitoringSourcesProps {
  competitorId: string
  competitorName: string
}

interface MonitoringSource {
  id: string
  source_type: string
  source_url: string
  is_active: boolean
  last_checked_at: string | null
  created_at: string
}

export function MonitoringSources({ competitorId, competitorName }: MonitoringSourcesProps) {
  const [sources, setSources] = useState<MonitoringSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSourceType, setNewSourceType] = useState("")
  const [newSourceUrl, setNewSourceUrl] = useState("")
  const [configureSource, setConfigureSource] = useState<MonitoringSource | null>(null)
  const [showConfigureDialog, setShowConfigureDialog] = useState(false)

  useEffect(() => {
    fetchSources()
  }, [competitorId])

  const fetchSources = async () => {
    try {
      const response = await fetch(`/api/sources?competitorId=${competitorId}`)
      const data = await response.json()
      if (data.sources) {
        setSources(data.sources)
      }
    } catch (error) {
      console.error("Error fetching sources:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSource = async () => {
    if (!newSourceType || !newSourceUrl) return

    setIsAdding(true)
    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorId,
          sourceType: newSourceType,
          sourceUrl: newSourceUrl,
        }),
      })

      if (response.ok) {
        setNewSourceType("")
        setNewSourceUrl("")
        setShowAddDialog(false)
        fetchSources()
      }
    } catch (error) {
      console.error("Error adding source:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleManualCheck = async () => {
    try {
      const response = await fetch("/api/monitor/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId }),
      })

      if (response.ok) {
        // Refresh sources to update last_checked_at
        fetchSources()
      }
    } catch (error) {
      console.error("Error running manual check:", error)
    }
  }

  const handleConfigureSource = (source: MonitoringSource) => {
    setConfigureSource(source)
    setShowConfigureDialog(true)
  }

  const handleUpdateSource = async () => {
    if (!configureSource) return

    try {
      const response = await fetch(`/api/sources/${configureSource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !configureSource.is_active,
        }),
      })

      if (response.ok) {
        setShowConfigureDialog(false)
        setConfigureSource(null)
        fetchSources()
      }
    } catch (error) {
      console.error("Error updating source:", error)
    }
  }

  const getSourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      website: "Website",
      changelog: "Changelog",
      blog: "Blog",
      social: "Social Media",
      app_store: "App Store",
      pricing_page: "Pricing Page",
    }
    return labels[type] || type
  }

  if (isLoading) {
    return <div>Loading monitoring sources...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monitoring Sources</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={handleManualCheck} variant="outline" size="sm">
              Check Now
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Add Source</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Monitoring Source</DialogTitle>
                  <DialogDescription>Add a new source to monitor for {competitorName}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Source Type</Label>
                    <Select value={newSourceType} onValueChange={setNewSourceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="changelog">Changelog</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="app_store">App Store</SelectItem>
                        <SelectItem value="pricing_page">Pricing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://example.com/changelog"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSource} disabled={isAdding}>
                      {isAdding ? "Adding..." : "Add Source"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showConfigureDialog} onOpenChange={setShowConfigureDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Monitoring Source</DialogTitle>
                  <DialogDescription>Configure settings for {configureSource?.source_url}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Active Status</Label>
                    <Badge variant={configureSource?.is_active ? "default" : "secondary"}>
                      {configureSource?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowConfigureDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateSource}>
                      {configureSource?.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 mb-4">No monitoring sources configured yet.</p>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              Add First Source
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="secondary">{getSourceTypeLabel(source.source_type)}</Badge>
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{source.source_url}</p>
                  <p className="text-xs text-slate-500">
                    Last checked: {source.last_checked_at ? new Date(source.last_checked_at).toLocaleString() : "Never"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleConfigureSource(source)}>
                  Configure
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
