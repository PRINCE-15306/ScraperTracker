"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"

interface AddCompetitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefilledUrl?: string
}

export function AddCompetitorDialog({ open, onOpenChange, prefilledUrl }: AddCompetitorDialogProps) {
  const [name, setName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [description, setDescription] = useState("")
  const [industry, setIndustry] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (prefilledUrl && open) {
      setWebsiteUrl(prefilledUrl)

      // Extract company name from URL
      try {
        const url = new URL(prefilledUrl)
        const hostname = url.hostname.replace("www.", "")
        const companyName = hostname.split(".")[0]
        setName(companyName.charAt(0).toUpperCase() + companyName.slice(1))
      } catch (error) {
        console.error("Error parsing URL:", error)
      }
    }
  }, [prefilledUrl, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in to add competitors")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.from("competitors").insert({
        name,
        website_url: websiteUrl,
        description,
        industry,
        user_id: user.id,
      })

      if (error) throw error

      // Reset form
      setName("")
      setWebsiteUrl("")
      setDescription("")
      setIndustry("")
      onOpenChange(false)

      // Refresh the page to show the new competitor
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Competitor</DialogTitle>
          <DialogDescription>Add a competitor to start tracking their product updates and changes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              placeholder="e.g., Slack, Notion, Figma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., SaaS, E-commerce, Fintech"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this competitor does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Adding..." : "Add Competitor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
