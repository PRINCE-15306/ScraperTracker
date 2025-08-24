import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { sendSlackMessage } from "@/lib/integrations/slack"
import { sendNotionPage } from "@/lib/integrations/notion"

export async function POST(request: NextRequest) {
  try {
    const { integrationType } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get integration settings
    const { data: integration } = await supabase
      .from("integration_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("integration_type", integrationType)
      .single()

    if (!integration) {
      return NextResponse.json({ error: "Integration not configured" }, { status: 404 })
    }

    const testMessage = {
      title: "🧪 Test Message from CompetitorTrack",
      content:
        "This is a test message to verify your integration is working correctly. You should see this in your configured channel or workspace.",
      timestamp: new Date().toISOString(),
    }

    let result
    if (integrationType === "slack") {
      result = await sendSlackMessage(integration.webhook_url, testMessage)
    } else if (integrationType === "notion") {
      result = await sendNotionPage(integration.access_token, integration.settings.databaseId, testMessage)
    } else {
      return NextResponse.json({ error: "Unsupported integration type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Integration test error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Test failed" }, { status: 500 })
  }
}
