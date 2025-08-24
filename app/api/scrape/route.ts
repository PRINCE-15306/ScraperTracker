import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { competitorId, url } = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting real scrape for:", url)

    const { data: existingSource } = await supabase
      .from("monitoring_sources")
      .select("id")
      .eq("competitor_id", competitorId)
      .eq("source_url", url)
      .eq("user_id", user.id)
      .single()

    let sourceId = existingSource?.id

    // Create monitoring source if it doesn't exist
    if (!sourceId) {
      const { data: newSource, error: sourceError } = await supabase
        .from("monitoring_sources")
        .insert({
          competitor_id: competitorId,
          user_id: user.id,
          source_type: "website",
          source_url: url,
          is_active: true,
        })
        .select("id")
        .single()

      if (sourceError) {
        console.error("Error creating monitoring source:", sourceError)
        return NextResponse.json({ error: "Failed to create monitoring source" }, { status: 500 })
      }

      sourceId = newSource.id
      console.log("[v0] Created new monitoring source:", sourceId)
    }

    // Real web scraping using fetch
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    console.log("[v0] Scraped HTML length:", html.length)

    // Extract meaningful content from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : "No title found"

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const description = descMatch ? descMatch[1].trim() : ""

    // Extract headings
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || []
    const headings = h1Matches.map((h) => h.replace(/<[^>]*>/g, "").trim()).slice(0, 5)

    // Simple change detection - in a real system, you'd compare with previous scrapes
    const content = {
      title,
      description,
      headings,
      lastScraped: new Date().toISOString(),
      url,
    }

    const { data: change, error: changeError } = await supabase
      .from("feature_changes")
      .insert({
        competitor_id: competitorId,
        source_id: sourceId, // Now properly referencing the monitoring source
        user_id: user.id,
        title: `Website Content Update - ${title}`,
        description: `Scraped content from ${url}`,
        change_type: "content_change", // Fixed change_type to match database constraint
        new_content: JSON.stringify(content),
        old_content: JSON.stringify({ note: "Initial scrape - no previous content" }),
        confidence_score: 0.8,
        is_important: true,
        is_reviewed: false,
        detected_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (changeError) {
      console.error("Error storing change:", changeError)
      return NextResponse.json({ error: "Failed to store scraped content" }, { status: 500 })
    }

    console.log("[v0] Successfully scraped and stored content")

    return NextResponse.json({
      success: true,
      content,
      change,
      sourceId,
      message: `Successfully scraped ${url} and detected content changes`,
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      {
        error: "Failed to scrape website",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
