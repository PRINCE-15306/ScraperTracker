import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: summaries, error } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching summaries:", error)
      return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 })
    }

    return NextResponse.json({ summaries })
  } catch (error) {
    console.error("Summaries GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
