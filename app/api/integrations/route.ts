import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: integrations, error } = await supabase.from("integration_settings").select("*").eq("user_id", user.id)

    if (error) {
      console.error("Error fetching integrations:", error)
      return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 })
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error("Integrations GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { integrationType, isEnabled, webhookUrl, channelId, accessToken, settings } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Upsert integration settings
    const { data, error } = await supabase
      .from("integration_settings")
      .upsert(
        {
          user_id: user.id,
          integration_type: integrationType,
          is_enabled: isEnabled,
          webhook_url: webhookUrl,
          channel_id: channelId,
          access_token: accessToken,
          settings: settings || {},
        },
        {
          onConflict: "user_id,integration_type",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("Error saving integration:", error)
      return NextResponse.json({ error: "Failed to save integration" }, { status: 500 })
    }

    return NextResponse.json({ success: true, integration: data })
  } catch (error) {
    console.error("Integrations POST API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
