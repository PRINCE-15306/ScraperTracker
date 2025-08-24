import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url, scrapedData } = await request.json()

    if (!url || !scrapedData) {
      return NextResponse.json({ success: false, error: "Missing required data" })
    }

    console.log("[v0] Starting web verification for:", url)

    // Simulate web verification process
    const verificationResult = {
      verified: true,
      confidence: 0.85,
      discrepancies: [] as string[],
      additionalFindings: [] as string[],
      sources: [] as string[],
    }

    try {
      // Simulate checking additional sources
      const domain = new URL(url).hostname
      const additionalSources = [
        `https://${domain}/about`,
        `https://${domain}/features`,
        `https://${domain}/plans`,
        `https://${domain}/enterprise`,
      ]

      verificationResult.sources = additionalSources

      // Simulate verification checks
      if (scrapedData.pricing && scrapedData.pricing.length > 0) {
        const prices = scrapedData.pricing
          .map((p: any) => Number.parseFloat(p.price.replace(/[^0-9.]/g, "")))
          .filter((p: number) => !isNaN(p))

        if (prices.some((p) => p > 10000)) {
          verificationResult.discrepancies.push("High pricing detected - verify enterprise tiers")
          verificationResult.confidence -= 0.1
        }

        if (prices.length < scrapedData.pricing.length / 2) {
          verificationResult.discrepancies.push("Many pricing items couldn't be parsed as numbers")
          verificationResult.confidence -= 0.15
        }
      }

      // Add industry-specific insights
      if (domain.includes("stripe") || domain.includes("payment")) {
        verificationResult.additionalFindings.push("Payment processor - transaction fees likely apply")
        verificationResult.additionalFindings.push("Regulatory compliance requirements may affect pricing")
      }

      if (domain.includes("saas") || domain.includes("software")) {
        verificationResult.additionalFindings.push("SaaS model - expect monthly/annual billing cycles")
        verificationResult.additionalFindings.push("Feature-based pricing tiers common in this industry")
      }

      // Simulate market research findings
      verificationResult.additionalFindings.push("Market trend: Increasing adoption of usage-based pricing")
      verificationResult.additionalFindings.push("Competitive landscape: Premium positioning strategy observed")

      // Final verification status
      verificationResult.verified = verificationResult.discrepancies.length < 3

      console.log("[v0] Web verification completed")

      return NextResponse.json({
        success: true,
        verification: verificationResult,
      })
    } catch (error) {
      console.error("[v0] Web verification error:", error)
      return NextResponse.json({
        success: false,
        error: "Web verification failed",
      })
    }
  } catch (error) {
    console.error("[v0] Web verify API error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process web verification request",
    })
  }
}
