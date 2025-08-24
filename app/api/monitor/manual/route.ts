import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { analyzeWebsiteChanges } from "@/lib/ai/change-analyzer"
import { scrapeWebsite } from "@/lib/scraper/website-scraper"

export async function POST(request: NextRequest) {
  try {
    const { competitorId } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get monitoring sources for this specific competitor
    const { data: sources, error: sourcesError } = await supabase
      .from("monitoring_sources")
      .select(`
        *,
        competitors (*)
      `)
      .eq("user_id", user.id)
      .eq("competitor_id", competitorId)
      .eq("is_active", true)

    if (sourcesError) {
      return NextResponse.json({ error: "Failed to fetch monitoring sources" }, { status: 500 })
    }

    const results = []

    for (const source of sources || []) {
      try {
        const currentContent = await scrapeWebsite(source.source_url)

        const { data: lastChange } = await supabase
          .from("feature_changes")
          .select("new_content")
          .eq("source_id", source.id)
          .order("detected_at", { ascending: false })
          .limit(1)
          .single()

        const previousContent = lastChange?.new_content || ""

        if (currentContent && currentContent !== previousContent) {
          const changes = await analyzeWebsiteChanges({
            previousContent,
            currentContent,
            websiteUrl: source.source_url,
            sourceType: source.source_type,
            competitorName: source.competitors.name,
          })

          for (const change of changes) {
            await supabase.from("feature_changes").insert({
              competitor_id: source.competitor_id,
              source_id: source.id,
              change_type: change.type,
              title: change.title,
              description: change.description,
              old_content: previousContent.substring(0, 5000),
              new_content: currentContent.substring(0, 5000),
              confidence_score: change.confidence,
              is_important: change.isImportant,
              user_id: user.id,
            })
          }

          results.push({
            source: source.source_url,
            changesDetected: changes.length,
            changes,
          })
        }

        await supabase
          .from("monitoring_sources")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", source.id)
      } catch (error) {
        console.error(`Error processing source ${source.source_url}:`, error)
        results.push({
          source: source.source_url,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Manual monitor API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
