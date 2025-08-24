import { type NextRequest, NextResponse } from "next/server"
import { EnhancedScraper } from "@/lib/scraper/enhanced-scraper"

export async function POST(request: NextRequest) {
  try {
    const { competitorId, url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 })
    }

    console.log(`[v0] Enhanced scraping: ${url}`)

    const scraper = new EnhancedScraper()
    const scrapedData = await scraper.scrapeWebsite(url)

    console.log(`[v0] Scraped data summary:`, {
      pricing: scrapedData.pricing.length,
      coupons: scrapedData.coupons.length,
      discounts: scrapedData.discounts.length,
      features: scrapedData.features.length,
      buttons: scrapedData.buttons.length,
    })

    return NextResponse.json({
      success: true,
      data: scrapedData,
      summary: {
        pricing: scrapedData.pricing.length,
        coupons: scrapedData.coupons.length,
        discounts: scrapedData.discounts.length,
        features: scrapedData.features.length,
        buttons: scrapedData.buttons.length,
      },
    })
  } catch (error) {
    console.error("[v0] Enhanced scraping error:", error)
    return NextResponse.json({ error: "Failed to perform enhanced scraping" }, { status: 500 })
  }
}
