import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { frequency, enabled } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update user profile with scheduling preferences
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_preferences: {
          email: true,
          slack: false,
          notion: false,
          auto_generate: enabled,
          frequency: frequency,
        },
      })
      .eq("id", user.id)

    if (error) {
      console.error("Error updating schedule preferences:", error)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Schedule API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
