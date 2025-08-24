import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { scrapedData } = await request.json()

    if (!scrapedData) {
      return NextResponse.json({ error: "Scraped data is required" }, { status: 400 })
    }

    console.log("[v0] Starting analysis for:", scrapedData.url)

    // Create a comprehensive analysis without requiring OpenAI API
    const analysis = `
COMPETITIVE INTELLIGENCE ANALYSIS
Website: ${scrapedData.title} (${scrapedData.url})
Analyzed: ${new Date().toLocaleString()}

PRICING STRATEGY:
• Found ${scrapedData.pricing.length} pricing elements
• Price points: ${scrapedData.pricing.map((p) => p.price).join(", ") || "None detected"}
• Pricing approach: ${scrapedData.pricing.length > 5 ? "Multiple tiers/options" : scrapedData.pricing.length > 0 ? "Simple pricing" : "No clear pricing displayed"}

PROMOTIONAL OFFERS:
• Coupon codes: ${scrapedData.coupons.length} found
• Discount offers: ${scrapedData.discounts.length} found
• Promotional strategy: ${scrapedData.coupons.length + scrapedData.discounts.length > 0 ? "Active promotion focus" : "Limited promotional activity"}

FEATURE POSITIONING:
• Key features highlighted: ${scrapedData.features.length}
• Top features: ${scrapedData.features.slice(0, 5).join(", ") || "None clearly identified"}
• Feature communication: ${scrapedData.features.length > 10 ? "Feature-rich positioning" : scrapedData.features.length > 0 ? "Focused feature set" : "Minimal feature emphasis"}

CONVERSION OPTIMIZATION:
• Call-to-action buttons: ${scrapedData.buttons.length}
• Primary CTAs: ${
      scrapedData.buttons
        .filter((b) => b.context === "conversion")
        .map((b) => b.text)
        .join(", ") || "None identified"
    }
• Conversion focus: ${scrapedData.buttons.filter((b) => b.context === "conversion").length > 0 ? "Strong conversion focus" : "Limited conversion optimization"}

CONTENT STRATEGY:
• Main headings: ${scrapedData.headings.length}
• Content depth: ${scrapedData.headings.length > 10 ? "Comprehensive content" : scrapedData.headings.length > 5 ? "Moderate content depth" : "Minimal content"}
• Key messaging: ${scrapedData.headings.slice(0, 3).join(" | ") || "Not clearly defined"}

COMPETITIVE INSIGHTS:
• Market positioning: ${scrapedData.pricing.length > 0 ? "Price-transparent" : "Price-opaque"} approach
• Customer acquisition: ${scrapedData.coupons.length + scrapedData.discounts.length > 0 ? "Discount-driven" : "Value-driven"} strategy
• Product complexity: ${scrapedData.features.length > 20 ? "Complex/Enterprise" : scrapedData.features.length > 10 ? "Mid-market" : "Simple/SMB"} focus

RECOMMENDATIONS:
${scrapedData.pricing.length === 0 ? "• Consider adding transparent pricing to improve conversion\n" : ""}${scrapedData.coupons.length + scrapedData.discounts.length === 0 ? "• Explore promotional strategies to drive acquisition\n" : ""}${scrapedData.buttons.filter((b) => b.context === "conversion").length < 3 ? "• Strengthen call-to-action elements\n" : ""}• Monitor pricing changes and promotional campaigns
• Track feature additions and messaging updates
• Analyze conversion funnel optimization efforts
    `.trim()

    console.log("[v0] Analysis complete")

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze scraped data" }, { status: 500 })
  }
}
