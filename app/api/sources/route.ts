import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { competitorId, sourceType, sourceUrl } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate that the competitor belongs to the user
    const { data: competitor } = await supabase
      .from("competitors")
      .select("id")
      .eq("id", competitorId)
      .eq("user_id", user.id)
      .single()

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 })
    }

    // Add the monitoring source
    const { data, error } = await supabase
      .from("monitoring_sources")
      .insert({
        competitor_id: competitorId,
        source_type: sourceType,
        source_url: sourceUrl,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding monitoring source:", error)
      return NextResponse.json({ error: "Failed to add monitoring source" }, { status: 500 })
    }

    return NextResponse.json({ success: true, source: data })
  } catch (error) {
    console.error("Sources API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitorId = searchParams.get("competitorId")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase.from("monitoring_sources").select("*").eq("user_id", user.id)

    if (competitorId) {
      query = query.eq("competitor_id", competitorId)
    }

    const { data: sources, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching monitoring sources:", error)
      return NextResponse.json({ error: "Failed to fetch monitoring sources" }, { status: 500 })
    }

    return NextResponse.json({ sources })
  } catch (error) {
    console.error("Sources GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
