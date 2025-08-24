import { type NextRequest, NextResponse } from "next/server"
import { IntelligentAnalyzer } from "@/lib/ai/intelligent-analyzer"

export async function POST(request: NextRequest) {
  try {
    const { data, includeWebVerification } = await request.json()

    if (!data) {
      return NextResponse.json({ success: false, error: "No data provided for analysis" })
    }

    console.log("[v0] Starting intelligent analysis...")

    const analyzer = new IntelligentAnalyzer()

    // Perform intelligent analysis
    const analysis = await analyzer.analyzeData(data)

    // Get learning statistics
    const learningStats = await analyzer.getLearningStats()

    let verification = null
    if (includeWebVerification && data.metadata?.url) {
      verification = await analyzer.verifyWithWeb(data, data.metadata.url)
    }

    console.log("[v0] Intelligent analysis completed successfully")

    return NextResponse.json({
      success: true,
      analysis,
      verification,
      learningStats,
    })
  } catch (error) {
    console.error("[v0] Intelligent analysis error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to perform intelligent analysis",
    })
  }
}
