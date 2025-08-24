import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const WeeklySummarySchema = z.object({
  overview: z.string().describe("Executive summary of the week's competitive landscape changes"),
  totalChanges: z.number().describe("Total number of changes detected"),
  importantChanges: z.number().describe("Number of strategically important changes"),
  competitorBreakdown: z.record(
    z.object({
      name: z.string(),
      changesCount: z.number(),
      importantChanges: z.number(),
      keyChanges: z.array(z.string()),
      riskLevel: z.enum(["low", "medium", "high"]).describe("Competitive threat level"),
    }),
  ),
  keyInsights: z.array(
    z.object({
      insight: z.string().describe("Strategic insight about competitive movements"),
      impact: z.enum(["low", "medium", "high"]).describe("Potential impact on your business"),
      competitors: z.array(z.string()).describe("Competitors involved in this insight"),
    }),
  ),
  recommendations: z.array(
    z.object({
      action: z.string().describe("Recommended action for product team"),
      priority: z.enum(["low", "medium", "high"]).describe("Priority level"),
      reasoning: z.string().describe("Why this action is recommended"),
      competitors: z.array(z.string()).describe("Competitors that triggered this recommendation"),
    }),
  ),
  trendAnalysis: z.object({
    emergingPatterns: z.array(z.string()).describe("Emerging patterns across competitors"),
    marketDirection: z.string().describe("Overall market direction insights"),
    competitiveGaps: z.array(z.string()).describe("Potential gaps or opportunities identified"),
  }),
})

export async function generateWeeklySummary(changes: any[], startDate: Date, endDate: Date) {
  try {
    console.log(`[v0] Generating AI summary for ${changes.length} changes`)

    // Group changes by competitor
    const changesByCompetitor = changes.reduce(
      (acc, change) => {
        const competitorName = change.competitors?.name || "Unknown"
        if (!acc[competitorName]) {
          acc[competitorName] = []
        }
        acc[competitorName].push(change)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Prepare data for AI analysis
    const competitorSummaries = Object.entries(changesByCompetitor).map(([name, competitorChanges]) => {
      return {
        name,
        industry: competitorChanges[0]?.competitors?.industry || "Unknown",
        totalChanges: competitorChanges.length,
        importantChanges: competitorChanges.filter((c) => c.is_important).length,
        changes: competitorChanges.map((c) => ({
          type: c.change_type,
          title: c.title,
          description: c.description,
          isImportant: c.is_important,
          confidence: c.confidence_score,
          source: c.monitoring_sources?.source_type || "unknown",
        })),
      }
    })

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: WeeklySummarySchema,
      prompt: `You are a senior competitive intelligence analyst creating a weekly summary for a product management team.

ANALYSIS PERIOD: ${startDate.toDateString()} to ${endDate.toDateString()}

COMPETITOR DATA:
${JSON.stringify(competitorSummaries, null, 2)}

Create a comprehensive weekly competitive intelligence summary that includes:

1. **Executive Overview**: High-level summary of the competitive landscape this week
2. **Competitor Breakdown**: Detailed analysis of each competitor's activities and threat level
3. **Key Strategic Insights**: Important patterns, trends, or strategic moves to watch
4. **Actionable Recommendations**: Specific actions the product team should consider
5. **Trend Analysis**: Emerging patterns and market direction insights

GUIDELINES:
- Focus on strategic implications for product decisions
- Prioritize changes that could impact market position or product strategy
- Identify opportunities and threats clearly
- Provide specific, actionable recommendations
- Consider the competitive context and industry dynamics
- Highlight any coordinated moves or industry-wide trends
- Assess risk levels based on competitor capabilities and market impact

Be concise but thorough. This summary will be used by product managers to make strategic decisions.`,
    })

    console.log(`[v0] AI summary generation complete`)
    return object
  } catch (error) {
    console.error("[v0] Error generating summary:", error)
    // Return a basic summary if AI fails
    const totalChanges = changes.length
    const importantChanges = changes.filter((c) => c.is_important).length

    return {
      overview: `This week, ${totalChanges} changes were detected across your tracked competitors, with ${importantChanges} marked as strategically important.`,
      totalChanges,
      importantChanges,
      competitorBreakdown: {},
      keyInsights: [],
      recommendations: [],
      trendAnalysis: {
        emergingPatterns: [],
        marketDirection: "Analysis unavailable due to processing error.",
        competitiveGaps: [],
      },
    }
  }
}
