import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { sendSlackSummary } from "@/lib/integrations/slack"
import { sendNotionSummary } from "@/lib/integrations/notion"

export async function POST(request: NextRequest) {
  try {
    const { summaryId } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the summary
    const { data: summary } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("id", summaryId)
      .eq("user_id", user.id)
      .single()

    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 })
    }

    // Get enabled integrations
    const { data: integrations } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_enabled", true)

    const results = []

    for (const integration of integrations || []) {
      try {
        let result
        if (integration.integration_type === "slack") {
          result = await sendSlackSummary(integration.webhook_url, summary)
        } else if (integration.integration_type === "notion") {
          result = await sendNotionSummary(integration.access_token, integration.settings.databaseId, summary)
        }

        results.push({
          type: integration.integration_type,
          success: true,
          result,
        })
      } catch (error) {
        console.error(`Error sending to ${integration.integration_type}:`, error)
        results.push({
          type: integration.integration_type,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Mark summary as sent
    await supabase
      .from("weekly_summaries")
      .update({
        is_sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", summaryId)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Send summary API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
