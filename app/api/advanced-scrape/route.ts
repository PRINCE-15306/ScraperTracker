import { type NextRequest, NextResponse } from "next/server"
import { EnhancedProductionScraper } from "@/lib/scraper/enhanced-production-scraper"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`[v0] Enhanced production scraping: ${url}`)

    const scraper = new EnhancedProductionScraper()
    const data = await scraper.scrapeWebsiteEnhanced(url)

    console.log(
      `[v0] Enhanced scrape complete: ${JSON.stringify({
        pricing: data.pricing.length,
        coupons: data.coupons.length,
        discounts: data.discounts.length,
        features: data.features.length,
        buttons: data.buttons.length,
        processingTime: data.metadata.processingTime,
        dataQuality: data.metadata.dataQuality,
        sources: data.metadata.sources.length,
      })}`,
    )

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`[v0] Enhanced scraping error: ${error}`)
    return NextResponse.json(
      {
        error: "Failed to scrape website",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
