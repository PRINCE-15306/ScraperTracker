import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { name, website_url, description } = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: competitor, error } = await supabase
      .from("competitors")
      .insert({
        name,
        website_url,
        description,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating competitor:", error)
      return NextResponse.json({ error: "Failed to create competitor" }, { status: 500 })
    }

    return NextResponse.json({ competitor })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: competitors, error } = await supabase
      .from("competitors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching competitors:", error)
      return NextResponse.json({ error: "Failed to fetch competitors" }, { status: 500 })
    }

    return NextResponse.json({ competitors })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
