import * as cheerio from "cheerio"

export interface ScrapedData {
  title: string
  description: string
  pricing: PricingInfo[]
  coupons: CouponInfo[]
  discounts: DiscountInfo[]
  features: string[]
  buttons: ButtonInfo[]
  metadata: {
    url: string
    scrapedAt: string
    wordCount: number
    imageCount: number
  }
}

export interface PricingInfo {
  price: string
  currency: string
  plan: string
  period?: string
  originalPrice?: string
  discount?: string
}

export interface CouponInfo {
  code: string
  description: string
  discount: string
  expiry?: string
}

export interface DiscountInfo {
  text: string
  percentage?: string
  amount?: string
  type: "percentage" | "fixed" | "bogo" | "free_shipping"
}

export interface ButtonInfo {
  text: string
  href?: string
  type: "cta" | "pricing" | "signup" | "demo" | "download"
}

export class EnhancedScraper {
  private pricePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD)/gi,
    /(?:from|starting at|only)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per month|\/month|monthly)/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per year|\/year|annually)/gi,
  ]

  private couponPatterns = [
    /(?:code|coupon):\s*([A-Z0-9]{3,20})/gi,
    /use\s+(?:code|coupon)\s+([A-Z0-9]{3,20})/gi,
    /promo\s+code:\s*([A-Z0-9]{3,20})/gi,
    /([A-Z0-9]{4,15})\s*(?:for|gets?)\s*(?:\d+%|\$\d+)\s*off/gi,
  ]

  private discountPatterns = [
    /(\d+)%\s*off/gi,
    /save\s*(\d+)%/gi,
    /(\d+)%\s*discount/gi,
    /\$(\d+(?:\.\d{2})?)\s*off/gi,
    /save\s*\$(\d+(?:\.\d{2})?)/gi,
    /buy\s*\d+\s*get\s*\d+\s*free/gi,
    /free\s*shipping/gi,
    /limited\s*time\s*offer/gi,
  ]

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    try {
      console.log(`[v0] Enhanced scraping: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Remove script and style elements
      $("script, style, noscript").remove()

      const scrapedData: ScrapedData = {
        title: this.extractTitle($),
        description: this.extractDescription($),
        pricing: this.extractPricing($),
        coupons: this.extractCoupons($),
        discounts: this.extractDiscounts($),
        features: this.extractFeatures($),
        buttons: this.extractButtons($),
        metadata: {
          url,
          scrapedAt: new Date().toISOString(),
          wordCount: $("body").text().split(/\s+/).length,
          imageCount: $("img").length,
        },
      }

      console.log(`[v0] Scraped data summary:`, {
        pricing: scrapedData.pricing.length,
        coupons: scrapedData.coupons.length,
        discounts: scrapedData.discounts.length,
        features: scrapedData.features.length,
        buttons: scrapedData.buttons.length,
      })

      return scrapedData
    } catch (error) {
      console.error(`[v0] Enhanced scraping error:`, error)
      throw error
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return $("title").text().trim() || $("h1").first().text().trim() || "No title found"
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return (
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().trim().substring(0, 200) ||
      "No description found"
    )
  }

  private extractPricing($: cheerio.CheerioAPI): PricingInfo[] {
    const pricing: PricingInfo[] = []
    const text = $("body").text()

    // Look for pricing in specific elements
    $('[class*="price"], [class*="pricing"], [id*="price"], [id*="pricing"]').each((_, el) => {
      const element = $(el)
      const elementText = element.text()

      this.pricePatterns.forEach((pattern) => {
        const matches = elementText.match(pattern)
        if (matches) {
          matches.forEach((match) => {
            const price = match.replace(/[^\d.,]/g, "")
            if (price && !pricing.some((p) => p.price === price)) {
              pricing.push({
                price: match,
                currency: this.detectCurrency(match),
                plan: this.detectPlan(element),
                period: this.detectPeriod(elementText),
              })
            }
          })
        }
      })
    })

    return pricing.slice(0, 10) // Limit to 10 pricing items
  }

  private extractCoupons($: cheerio.CheerioAPI): CouponInfo[] {
    const coupons: CouponInfo[] = []
    const text = $("body").text()

    this.couponPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const code = match.replace(/[^A-Z0-9]/g, "")
          if (code.length >= 3 && code.length <= 20) {
            coupons.push({
              code,
              description: match,
              discount: this.extractDiscountFromText(match),
            })
          }
        })
      }
    })

    return coupons.slice(0, 5) // Limit to 5 coupons
  }

  private extractDiscounts($: cheerio.CheerioAPI): DiscountInfo[] {
    const discounts: DiscountInfo[] = []
    const text = $("body").text()

    this.discountPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          discounts.push({
            text: match,
            percentage: this.extractPercentage(match),
            amount: this.extractAmount(match),
            type: this.classifyDiscount(match),
          })
        })
      }
    })

    return discounts.slice(0, 10) // Limit to 10 discounts
  }

  private extractFeatures($: cheerio.CheerioAPI): string[] {
    const features: string[] = []

    // Look for feature lists
    $("ul li, ol li").each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 10 && text.length < 100) {
        features.push(text)
      }
    })

    // Look for feature sections
    $('[class*="feature"], [class*="benefit"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 10 && text.length < 100) {
        features.push(text)
      }
    })

    return features.slice(0, 20) // Limit to 20 features
  }

  private extractButtons($: cheerio.CheerioAPI): ButtonInfo[] {
    const buttons: ButtonInfo[] = []

    $('button, a[class*="btn"], a[class*="button"], input[type="submit"]').each((_, el) => {
      const element = $(el)
      const text = element.text().trim()
      const href = element.attr("href")

      if (text && text.length > 0) {
        buttons.push({
          text,
          href,
          type: this.classifyButton(text, href),
        })
      }
    })

    return buttons.slice(0, 15) // Limit to 15 buttons
  }

  private detectCurrency(price: string): string {
    if (price.includes("$")) return "USD"
    if (price.includes("€")) return "EUR"
    if (price.includes("£")) return "GBP"
    return "USD" // Default
  }

  private detectPlan(element: cheerio.Cheerio<cheerio.Element>): string {
    const text = element.closest('[class*="plan"], [class*="tier"]').text()
    const planMatch = text.match(/(basic|pro|premium|enterprise|starter|business|free)/i)
    return planMatch ? planMatch[1] : "Unknown"
  }

  private detectPeriod(text: string): string | undefined {
    if (/month|monthly/i.test(text)) return "monthly"
    if (/year|yearly|annual/i.test(text)) return "yearly"
    return undefined
  }

  private extractDiscountFromText(text: string): string {
    const percentMatch = text.match(/(\d+)%/)
    if (percentMatch) return `${percentMatch[1]}%`

    const dollarMatch = text.match(/\$(\d+)/)
    if (dollarMatch) return `$${dollarMatch[1]}`

    return "Unknown"
  }

  private extractPercentage(text: string): string | undefined {
    const match = text.match(/(\d+)%/)
    return match ? match[1] : undefined
  }

  private extractAmount(text: string): string | undefined {
    const match = text.match(/\$(\d+(?:\.\d{2})?)/)
    return match ? match[1] : undefined
  }

  private classifyDiscount(text: string): DiscountInfo["type"] {
    if (/%/.test(text)) return "percentage"
    if (/\$/.test(text)) return "fixed"
    if (/buy.*get.*free|bogo/i.test(text)) return "bogo"
    if (/free.*shipping/i.test(text)) return "free_shipping"
    return "percentage"
  }

  private classifyButton(text: string, href?: string): ButtonInfo["type"] {
    const lowerText = text.toLowerCase()

    if (/sign up|register|join|create account/i.test(text)) return "signup"
    if (/demo|try|preview/i.test(text)) return "demo"
    if (/download|install/i.test(text)) return "download"
    if (/price|pricing|buy|purchase|order/i.test(text)) return "pricing"
    if (/get started|start|begin|learn more/i.test(text)) return "cta"

    return "cta"
  }
}
