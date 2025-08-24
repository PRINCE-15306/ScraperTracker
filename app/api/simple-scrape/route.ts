import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log("[v0] Simple scraping:", url)

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    console.log("[v0] HTML fetched, length:", html.length)

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    const description = descMatch ? descMatch[1].trim() : "No description available"

    // Extract pricing information
    const pricing = []
    const pricePatterns = [
      /\$[\d,]+(?:\.\d{2})?/g,
      /€[\d,]+(?:\.\d{2})?/g,
      /£[\d,]+(?:\.\d{2})?/g,
      /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP)/gi,
      /(?:from|starting|only)\s*\$[\d,]+/gi,
      /\$[\d,]+\s*(?:\/month|\/year|per month|per year)/gi,
    ]

    pricePatterns.forEach((pattern) => {
      const matches = html.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          // Get context around the price
          const index = html.indexOf(match)
          const contextStart = Math.max(0, index - 100)
          const contextEnd = Math.min(html.length, index + 100)
          const context = html
            .slice(contextStart, contextEnd)
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()

          pricing.push({
            price: match.trim(),
            text: context,
            context: "pricing",
          })
        })
      }
    })

    // Extract coupon codes
    const coupons = []
    const couponPatterns = [
      /(?:code|coupon):\s*([A-Z0-9]{3,20})/gi,
      /use\s+(?:code|coupon)\s+([A-Z0-9]{3,20})/gi,
      /promo\s+code:\s*([A-Z0-9]{3,20})/gi,
    ]

    couponPatterns.forEach((pattern) => {
      const matches = [...html.matchAll(pattern)]
      matches.forEach((match) => {
        const code = match[1]
        const index = html.indexOf(match[0])
        const contextStart = Math.max(0, index - 50)
        const contextEnd = Math.min(html.length, index + 50)
        const context = html
          .slice(contextStart, contextEnd)
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()

        coupons.push({
          code,
          text: context,
          context: "coupon",
        })
      })
    })

    // Extract discount offers
    const discounts = []
    const discountPatterns = [
      /(\d+%)\s*(?:off|discount|save)/gi,
      /(?:save|discount|off)\s*(\d+%)/gi,
      /(\d+%)\s*(?:reduction|markdown)/gi,
    ]

    discountPatterns.forEach((pattern) => {
      const matches = [...html.matchAll(pattern)]
      matches.forEach((match) => {
        const percentage = match[1]
        const index = html.indexOf(match[0])
        const contextStart = Math.max(0, index - 50)
        const contextEnd = Math.min(html.length, index + 50)
        const context = html
          .slice(contextStart, contextEnd)
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()

        discounts.push({
          percentage,
          text: context,
          context: "discount",
        })
      })
    })

    // Extract headings
    const headings = []
    const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi)
    if (headingMatches) {
      headingMatches.forEach((match) => {
        const text = match.replace(/<[^>]*>/g, "").trim()
        if (text && text.length > 3) {
          headings.push(text)
        }
      })
    }

    // Extract features (look for lists and feature-like content)
    const features = []
    const featurePatterns = [
      /<li[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/li>/gi,
      /<div[^>]*class="[^"]*feature[^"]*"[^>]*>([^<]+)<\/div>/gi,
      /<span[^>]*class="[^"]*feature[^"]*"[^>]*>([^<]+)<\/span>/gi,
    ]

    featurePatterns.forEach((pattern) => {
      const matches = [...html.matchAll(pattern)]
      matches.forEach((match) => {
        const text = match[1]
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        if (text && text.length > 5 && text.length < 200) {
          features.push(text)
        }
      })
    })

    // Extract buttons
    const buttons = []
    const buttonMatches = html.match(/<(?:button|a)[^>]*>([^<]+)<\/(?:button|a)>/gi)
    if (buttonMatches) {
      buttonMatches.forEach((match) => {
        const text = match.replace(/<[^>]*>/g, "").trim()
        if (text && text.length > 1 && text.length < 50) {
          let type = "button"
          let context = "general"

          const lowerMatch = match.toLowerCase()
          if (lowerMatch.includes("buy") || lowerMatch.includes("purchase") || lowerMatch.includes("order")) {
            type = "purchase"
            context = "conversion"
          } else if (lowerMatch.includes("sign") || lowerMatch.includes("register") || lowerMatch.includes("join")) {
            type = "signup"
            context = "conversion"
          } else if (lowerMatch.includes("learn") || lowerMatch.includes("more") || lowerMatch.includes("demo")) {
            type = "info"
            context = "engagement"
          }

          buttons.push({
            text,
            type,
            context,
          })
        }
      })
    }

    // Remove duplicates
    const uniquePricing = pricing
      .filter((item, index, self) => index === self.findIndex((t) => t.price === item.price))
      .slice(0, 20)

    const uniqueCoupons = coupons
      .filter((item, index, self) => index === self.findIndex((t) => t.code === item.code))
      .slice(0, 10)

    const uniqueDiscounts = discounts
      .filter((item, index, self) => index === self.findIndex((t) => t.percentage === item.percentage))
      .slice(0, 10)

    const uniqueFeatures = [...new Set(features)].slice(0, 50)
    const uniqueButtons = buttons
      .filter((item, index, self) => index === self.findIndex((t) => t.text === item.text))
      .slice(0, 30)
    const uniqueHeadings = [...new Set(headings)].slice(0, 20)

    const scrapedData = {
      url,
      title,
      description,
      pricing: uniquePricing,
      coupons: uniqueCoupons,
      discounts: uniqueDiscounts,
      features: uniqueFeatures,
      buttons: uniqueButtons,
      headings: uniqueHeadings,
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalElements:
          uniquePricing.length +
          uniqueCoupons.length +
          uniqueDiscounts.length +
          uniqueFeatures.length +
          uniqueButtons.length,
      },
    }

    console.log("[v0] Scraping complete:", {
      pricing: uniquePricing.length,
      coupons: uniqueCoupons.length,
      discounts: uniqueDiscounts.length,
      features: uniqueFeatures.length,
      buttons: uniqueButtons.length,
    })

    return NextResponse.json(scrapedData)
  } catch (error) {
    console.error("[v0] Simple scrape error:", error)
    return NextResponse.json({ error: "Failed to scrape website" }, { status: 500 })
  }
}
