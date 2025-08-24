import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const ChangeSchema = z.object({
  changes: z.array(
    z.object({
      type: z.enum([
        "feature_added",
        "feature_removed",
        "feature_updated",
        "pricing_change",
        "ui_change",
        "content_change",
      ]),
      title: z.string().describe("Brief title describing the change"),
      description: z.string().describe("Detailed description of what changed"),
      confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
      isImportant: z.boolean().describe("Whether this change is strategically important for competitors to know about"),
      evidence: z.string().describe("Specific text or elements that indicate this change"),
    }),
  ),
})

interface AnalyzeChangesParams {
  previousContent: string
  currentContent: string
  websiteUrl: string
  sourceType: string
  competitorName: string
}

export async function analyzeWebsiteChanges({
  previousContent,
  currentContent,
  websiteUrl,
  sourceType,
  competitorName,
}: AnalyzeChangesParams) {
  try {
    console.log(`[v0] Analyzing changes for ${competitorName} (${websiteUrl})`)

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: ChangeSchema,
      prompt: `You are an expert product analyst specializing in competitive intelligence. 

Analyze the changes between these two versions of ${competitorName}'s ${sourceType} content from ${websiteUrl}.

PREVIOUS CONTENT:
${previousContent.substring(0, 4000)}

CURRENT CONTENT:
${currentContent.substring(0, 4000)}

Your task is to identify meaningful changes that would be valuable for product managers to track. Focus on:

1. **New Features**: Product capabilities, tools, or services that were added
2. **Removed Features**: Capabilities that were discontinued or removed
3. **Feature Updates**: Significant improvements or changes to existing features
4. **Pricing Changes**: New pricing tiers, price adjustments, or billing model changes
5. **UI/UX Changes**: Major interface updates, new design patterns, or user experience improvements
6. **Strategic Content**: New messaging, positioning, target markets, or value propositions

IMPORTANT GUIDELINES:
- Only report changes that are strategically relevant for competitive analysis
- Ignore minor text edits, typos, or cosmetic changes
- Focus on changes that indicate product direction, market positioning, or feature development
- Set confidence scores based on how clear and significant the change is
- Mark changes as "important" if they represent major product updates, new market moves, or competitive threats
- If no meaningful changes are detected, return an empty changes array

Provide specific evidence from the content to support each identified change.`,
    })

    console.log(`[v0] AI analysis complete: ${object.changes.length} changes detected`)
    return object.changes
  } catch (error) {
    console.error("[v0] Error in AI analysis:", error)
    // Return empty array if AI analysis fails
    return []
  }
}
