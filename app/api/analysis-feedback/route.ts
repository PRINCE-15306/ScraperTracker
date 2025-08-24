import { type NextRequest, NextResponse } from "next/server"
import { IntelligentAnalyzer } from "@/lib/ai/intelligent-analyzer"

export async function POST(request: NextRequest) {
  try {
    const { analysisId, feedback, accuracyScore } = await request.json()

    if (!analysisId || !feedback) {
      return NextResponse.json({ success: false, error: "Missing required data" })
    }

    console.log("[v0] Processing analysis feedback:", feedback)

    const analyzer = new IntelligentAnalyzer()
    await analyzer.provideFeedback(analysisId, feedback, accuracyScore)

    const learningStats = await analyzer.getLearningStats()

    console.log("[v0] Feedback processed successfully")

    return NextResponse.json({
      success: true,
      message: "Feedback received and processed for learning improvement",
      learningStats: learningStats,
      feedbackProcessed: {
        analysisId,
        feedback,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Feedback processing error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process feedback",
    })
  }
}
