import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { analyzeWebsiteChanges } from "@/lib/ai/change-analyzer"
import { scrapeWebsite } from "@/lib/scraper/website-scraper"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active monitoring sources for this user
    const { data: sources, error: sourcesError } = await supabase
      .from("monitoring_sources")
      .select(`
        *,
        competitors (*)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (sourcesError) {
      console.error("Error fetching monitoring sources:", sourcesError)
      return NextResponse.json({ error: "Failed to fetch monitoring sources" }, { status: 500 })
    }

    const results = []

    // Process each monitoring source
    for (const source of sources || []) {
      try {
        console.log(`[v0] Processing source: ${source.source_url}`)

        // Scrape the current content
        const currentContent = await scrapeWebsite(source.source_url)

        // Get the last known content for comparison
        const { data: lastChange } = await supabase
          .from("feature_changes")
          .select("new_content")
          .eq("source_id", source.id)
          .order("detected_at", { ascending: false })
          .limit(1)
          .single()

        const previousContent = lastChange?.new_content || ""

        // Use AI to analyze changes
        if (currentContent && currentContent !== previousContent) {
          console.log(`[v0] Content changed for ${source.source_url}, analyzing...`)

          const changes = await analyzeWebsiteChanges({
            previousContent,
            currentContent,
            websiteUrl: source.source_url,
            sourceType: source.source_type,
            competitorName: source.competitors.name,
          })

          // Store detected changes
          for (const change of changes) {
            const { error: insertError } = await supabase.from("feature_changes").insert({
              competitor_id: source.competitor_id,
              source_id: source.id,
              change_type: change.type,
              title: change.title,
              description: change.description,
              old_content: previousContent.substring(0, 5000), // Limit content size
              new_content: currentContent.substring(0, 5000),
              confidence_score: change.confidence,
              is_important: change.isImportant,
              user_id: user.id,
            })

            if (insertError) {
              console.error("Error inserting change:", insertError)
            }
          }

          results.push({
            source: source.source_url,
            changesDetected: changes.length,
            changes: changes.map((c) => ({ title: c.title, type: c.type, confidence: c.confidence })),
          })
        } else {
          console.log(`[v0] No changes detected for ${source.source_url}`)
          results.push({
            source: source.source_url,
            changesDetected: 0,
            changes: [],
          })
        }

        // Update last checked timestamp
        await supabase
          .from("monitoring_sources")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", source.id)
      } catch (error) {
        console.error(`Error processing source ${source.source_url}:`, error)
        results.push({
          source: source.source_url,
          error: error instanceof Error ? error.message : "Unknown error",
          changesDetected: 0,
          changes: [],
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: sources?.length || 0,
      results,
    })
  } catch (error) {
    console.error("Monitor API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
