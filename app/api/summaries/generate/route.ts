import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateWeeklySummary } from "@/lib/ai/summary-generator"

export async function POST(request: NextRequest) {
  try {
    const { weekStartDate } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startDate = new Date(weekStartDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    console.log(`[v0] Generating summary for week ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Check if summary already exists for this week
    const { data: existingSummary } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start_date", startDate.toISOString().split("T")[0])
      .single()

    if (existingSummary) {
      return NextResponse.json({
        success: true,
        summary: existingSummary,
        message: "Summary already exists for this week",
      })
    }

    // Fetch all changes for the week
    const { data: changes, error: changesError } = await supabase
      .from("feature_changes")
      .select(`
        *,
        competitors (name, industry, website_url),
        monitoring_sources (source_type, source_url)
      `)
      .eq("user_id", user.id)
      .gte("detected_at", startDate.toISOString())
      .lt("detected_at", endDate.toISOString())
      .order("detected_at", { ascending: false })

    if (changesError) {
      console.error("Error fetching changes:", changesError)
      return NextResponse.json({ error: "Failed to fetch changes" }, { status: 500 })
    }

    if (!changes || changes.length === 0) {
      // Create empty summary
      const { data: summary, error: insertError } = await supabase
        .from("weekly_summaries")
        .insert({
          week_start_date: startDate.toISOString().split("T")[0],
          week_end_date: endDate.toISOString().split("T")[0],
          summary_content: {
            overview: "No changes detected this week.",
            totalChanges: 0,
            importantChanges: 0,
            competitorBreakdown: {},
            keyInsights: [],
            recommendations: [],
            trendAnalysis: {
              emergingPatterns: [],
              marketDirection: "No significant market movements detected this week.",
              competitiveGaps: [],
            },
          },
          total_changes: 0,
          important_changes: 0,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating empty summary:", insertError)
        return NextResponse.json({ error: "Failed to create summary" }, { status: 500 })
      }

      return NextResponse.json({ success: true, summary })
    }

    // Generate AI-powered summary
    console.log(`[v0] Generating AI summary for ${changes.length} changes`)
    const summaryContent = await generateWeeklySummary(changes, startDate, endDate)

    // Store the summary
    const { data: summary, error: insertError } = await supabase
      .from("weekly_summaries")
      .insert({
        week_start_date: startDate.toISOString().split("T")[0],
        week_end_date: endDate.toISOString().split("T")[0],
        summary_content: summaryContent,
        total_changes: changes.length,
        important_changes: changes.filter((c) => c.is_important).length,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error storing summary:", insertError)
      return NextResponse.json({ error: "Failed to store summary" }, { status: 500 })
    }

    console.log(`[v0] Successfully generated and stored weekly summary`)
    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("Generate summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
