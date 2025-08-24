import { type NextRequest, NextResponse } from "next/server"
import { ProductionScraper } from "@/lib/scraper/production-scraper"

export async function POST(request: NextRequest) {
  try {
    const { url, maxPages = 3 } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`[v0] Production scraping: ${url}`)

    const scraper = new ProductionScraper()
    const data = await scraper.scrapeWebsiteComprehensive(url, maxPages)

    console.log(`[v0] Production scrape complete:`, {
      pricing: data.pricing.length,
      coupons: data.coupons.length,
      discounts: data.discounts.length,
      features: data.features.length,
      buttons: data.buttons.length,
      pagesScraped: data.metadata.pagesScraped,
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error(`[v0] Production scraping error:`, error)
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 })
  }
}
