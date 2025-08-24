import * as cheerio from "cheerio"

export interface EnhancedScrapedData {
  title: string
  description: string
  pricing: EnhancedPricingInfo[]
  coupons: CouponInfo[]
  discounts: DiscountInfo[]
  features: FeatureInfo[]
  buttons: ButtonInfo[]
  pages: PageInfo[]
  metadata: {
    url: string
    scrapedAt: string
    wordCount: number
    imageCount: number
    pagesScraped: number
  }
}

export interface EnhancedPricingInfo {
  price: string
  currency: string
  plan: string
  period?: string
  originalPrice?: string
  discount?: string
  features: string[]
  category: "subscription" | "one-time" | "usage-based" | "freemium" | "enterprise"
  confidence: number
  context: string
}

export interface FeatureInfo {
  text: string
  category: "core" | "premium" | "enterprise" | "addon"
  plan?: string
}

export interface PageInfo {
  url: string
  title: string
  type: "pricing" | "features" | "plans" | "offers" | "coupons"
}

export interface CouponInfo {
  code: string
  description: string
  discount: string
  expiry?: string
  terms?: string
}

export interface DiscountInfo {
  text: string
  percentage?: string
  amount?: string
  type: "percentage" | "fixed" | "bogo" | "free_shipping" | "limited_time"
  validUntil?: string
}

export interface ButtonInfo {
  text: string
  href?: string
  type: "cta" | "pricing" | "signup" | "demo" | "download"
  plan?: string
}

export class ProductionScraper {
  private pricingSelectors = [
    '[class*="price"]:not(script):not(style)',
    '[class*="pricing"]:not(script):not(style)',
    '[class*="plan"]:not(script):not(style)',
    '[class*="tier"]:not(script):not(style)',
    '[id*="price"]:not(script):not(style)',
    '[id*="pricing"]:not(script):not(style)',
    "[data-price]:not(script):not(style)",
    ".cost:not(script):not(style)",
    ".amount:not(script):not(style)",
  ]

  private enhancedPricePatterns = [
    { pattern: /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/\s*(month|year|mo|yr))?/gi, type: "subscription" },
    {
      pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD)\s*(?:\/\s*(month|year|mo|yr))?/gi,
      type: "subscription",
    },
    { pattern: /(?:from|starting\s+at|only)\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, type: "freemium" },
    { pattern: /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(month|year|user|seat)/gi, type: "subscription" },
    { pattern: /free/gi, type: "freemium" },
    { pattern: /contact\s+(?:us|sales)|custom\s+pricing|enterprise/gi, type: "enterprise" },
  ]

  private couponSelectors = [
    '[class*="coupon"]:not(script):not(style)',
    '[class*="promo"]:not(script):not(style)',
    '[class*="discount"]:not(script):not(style)',
    '[class*="offer"]:not(script):not(style)',
    "[data-coupon]:not(script):not(style)",
  ]

  async scrapeWebsiteComprehensive(baseUrl: string, maxPages = 5): Promise<EnhancedScrapedData> {
    try {
      console.log(`[v0] Starting comprehensive scrape for: ${baseUrl}`)

      const mainData = await this.scrapePage(baseUrl)
      const relatedPages = await this.findRelatedPages(baseUrl, maxPages)

      const allCoupons: CouponInfo[] = [...mainData.coupons]
      const allDiscounts: DiscountInfo[] = [...mainData.discounts]

      // Scrape related pages for additional coupons and discounts
      for (const pageUrl of relatedPages) {
        try {
          const pageData = await this.scrapePage(pageUrl)
          allCoupons.push(...pageData.coupons)
          allDiscounts.push(...pageData.discounts)
        } catch (error) {
          console.log(`[v0] Failed to scrape ${pageUrl}:`, error)
        }
      }

      return {
        ...mainData,
        coupons: this.deduplicateCoupons(allCoupons),
        discounts: this.deduplicateDiscounts(allDiscounts),
        pages: relatedPages.map((url) => ({
          url,
          title: "Related page",
          type: this.classifyPageType(url),
        })),
        metadata: {
          ...mainData.metadata,
          pagesScraped: relatedPages.length + 1,
        },
      }
    } catch (error) {
      console.error(`[v0] Comprehensive scraping error:`, error)
      throw error
    }
  }

  private async scrapePage(url: string): Promise<EnhancedScrapedData> {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Remove script, style, and other non-content elements
    $("script, style, noscript, iframe, object, embed").remove()

    return {
      title: this.extractTitle($),
      description: this.extractDescription($),
      pricing: this.extractEnhancedPricing($),
      coupons: this.extractEnhancedCoupons($),
      discounts: this.extractEnhancedDiscounts($),
      features: this.extractEnhancedFeatures($),
      buttons: this.extractEnhancedButtons($),
      pages: [],
      metadata: {
        url,
        scrapedAt: new Date().toISOString(),
        wordCount: $("body").text().split(/\s+/).length,
        imageCount: $("img").length,
        pagesScraped: 1,
      },
    }
  }

  private async findRelatedPages(baseUrl: string, maxPages: number): Promise<string[]> {
    try {
      const response = await fetch(baseUrl)
      const html = await response.text()
      const $ = cheerio.load(html)

      const relatedPages: string[] = []
      const baseUrlObj = new URL(baseUrl)

      // Look for pricing, plans, offers, coupons pages
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href")
        if (!href) return

        const linkText = $(el).text().toLowerCase()
        const hrefLower = href.toLowerCase()

        if (
          /pricing|plans|offers|coupons|discounts|deals|promotions/.test(linkText) ||
          /pricing|plans|offers|coupons|discounts|deals|promotions/.test(hrefLower)
        ) {
          try {
            const fullUrl = new URL(href, baseUrl).toString()
            if (fullUrl.startsWith(baseUrlObj.origin) && !relatedPages.includes(fullUrl)) {
              relatedPages.push(fullUrl)
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      })

      return relatedPages.slice(0, maxPages)
    } catch (error) {
      console.log(`[v0] Failed to find related pages:`, error)
      return []
    }
  }

  private extractEnhancedPricing($: cheerio.CheerioAPI): EnhancedPricingInfo[] {
    const pricing: EnhancedPricingInfo[] = []

    this.pricingSelectors.forEach((selector) => {
      $(selector).each((_, el) => {
        const element = $(el)
        const elementText = element.text().trim()
        const parentText = element.parent().text().trim()
        const contextText = element.closest('[class*="plan"], [class*="tier"], [class*="package"]').text().trim()

        // Skip if element is too small or likely not pricing
        if (elementText.length < 2 || elementText.length > 200) return

        this.enhancedPricePatterns.forEach(({ pattern, type }) => {
          const matches = elementText.match(pattern)
          if (matches) {
            matches.forEach((match) => {
              const cleanPrice = this.cleanPrice(match)
              if (this.isValidPrice(cleanPrice, elementText)) {
                const planName = this.extractPlanName(element, contextText)
                const features = this.extractPlanFeatures(element)

                pricing.push({
                  price: cleanPrice,
                  currency: this.detectCurrency(match),
                  plan: planName,
                  period: this.detectPeriod(match),
                  features,
                  category: type as any,
                  confidence: this.calculatePriceConfidence(match, elementText, contextText),
                  context: contextText.substring(0, 100),
                })
              }
            })
          }
        })
      })
    })

    return this.deduplicatePricing(pricing).slice(0, 15)
  }

  private extractEnhancedCoupons($: cheerio.CheerioAPI): CouponInfo[] {
    const coupons: CouponInfo[] = []

    this.couponSelectors.forEach((selector) => {
      $(selector).each((_, el) => {
        const element = $(el)
        const text = element.text().trim()

        const codeMatch = text.match(/(?:code|coupon):\s*([A-Z0-9]{3,20})|use\s+(?:code|coupon)\s+([A-Z0-9]{3,20})/gi)
        if (codeMatch) {
          const code = codeMatch[0].replace(/[^A-Z0-9]/g, "")
          const discount = this.extractDiscountFromContext(element)
          const terms = this.extractTermsFromContext(element)

          coupons.push({
            code,
            description: text.substring(0, 100),
            discount,
            terms,
          })
        }
      })
    })

    return coupons.slice(0, 10)
  }

  private extractEnhancedDiscounts($: cheerio.CheerioAPI): DiscountInfo[] {
    const discounts: DiscountInfo[] = []

    $('[class*="discount"], [class*="offer"], [class*="sale"], [class*="deal"]').each((_, el) => {
      const element = $(el)
      const text = element.text().trim()

      const percentMatch = text.match(/(\d+)%\s*off/gi)
      const dollarMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*off/gi)
      const limitedTimeMatch = text.match(/limited\s*time|expires?|until/gi)

      if (percentMatch || dollarMatch) {
        discounts.push({
          text: text.substring(0, 100),
          percentage: percentMatch ? percentMatch[0].match(/\d+/)?.[0] : undefined,
          amount: dollarMatch ? dollarMatch[0].match(/\d+(?:\.\d{2})?/)?.[0] : undefined,
          type: this.classifyDiscountType(text),
          validUntil: limitedTimeMatch ? this.extractExpiryDate(text) : undefined,
        })
      }
    })

    return discounts.slice(0, 15)
  }

  private extractEnhancedFeatures($: cheerio.CheerioAPI): FeatureInfo[] {
    const features: FeatureInfo[] = []

    $('ul li, ol li, [class*="feature"], [class*="benefit"]').each((_, el) => {
      const element = $(el)
      const text = element.text().trim()
      const planContext = element
        .closest('[class*="plan"], [class*="tier"]')
        .find('[class*="name"], h1, h2, h3')
        .first()
        .text()
        .trim()

      if (text.length > 5 && text.length < 150 && this.isValidFeature(text)) {
        features.push({
          text,
          category: this.categorizeFeature(text, planContext),
          plan: planContext || undefined,
        })
      }
    })

    return features.slice(0, 30)
  }

  private extractEnhancedButtons($: cheerio.CheerioAPI): ButtonInfo[] {
    const buttons: ButtonInfo[] = []

    $('button, a[class*="btn"], a[class*="button"], input[type="submit"]').each((_, el) => {
      const element = $(el)
      const text = element.text().trim()
      const href = element.attr("href")
      const planContext = element
        .closest('[class*="plan"], [class*="tier"]')
        .find('[class*="name"], h1, h2, h3')
        .first()
        .text()
        .trim()

      if (text && text.length > 0 && text.length < 50) {
        buttons.push({
          text,
          href,
          type: this.classifyButton(text, href),
          plan: planContext || undefined,
        })
      }
    })

    return buttons.slice(0, 20)
  }

  private cleanPrice(price: string): string {
    return price.replace(/[^\d.,]/g, "").replace(/,/g, "")
  }

  private isValidPrice(price: string, context: string): boolean {
    const numPrice = Number.parseFloat(price)
    // Filter out obviously wrong prices (like single digits in random contexts)
    if (numPrice < 0.01 || numPrice > 100000) return false
    if (price.length < 2) return false
    // Check if it's in a JavaScript context (common source of false positives)
    if (/\|\||&&|function|var |let |const |return/.test(context)) return false
    return true
  }

  private calculatePriceConfidence(match: string, elementText: string, contextText: string): number {
    let confidence = 0.5

    if (/plan|tier|package|subscription/.test(contextText.toLowerCase())) confidence += 0.3
    if (/month|year|annual/.test(match.toLowerCase())) confidence += 0.2
    if (/\$\d+\.\d{2}/.test(match)) confidence += 0.1
    if (elementText.length < 20) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  private extractPlanName(element: cheerio.Cheerio<cheerio.Element>, contextText: string): string {
    const planMatch = contextText.match(
      /(basic|pro|premium|enterprise|starter|business|free|plus|advanced|professional)/i,
    )
    if (planMatch) return planMatch[1]

    const headingText = element.closest('[class*="plan"], [class*="tier"]').find("h1, h2, h3, h4").first().text().trim()
    return headingText || "Unknown Plan"
  }

  private extractPlanFeatures(element: cheerio.Cheerio<cheerio.Element>): string[] {
    const features: string[] = []
    element
      .closest('[class*="plan"], [class*="tier"]')
      .find("ul li, ol li")
      .each((_, li) => {
        const text = element.constructor(li).text().trim()
        if (text.length > 5 && text.length < 100) {
          features.push(text)
        }
      })
    return features.slice(0, 10)
  }

  private categorizeFeature(text: string, planContext: string): FeatureInfo["category"] {
    const lowerText = text.toLowerCase()
    const lowerPlan = planContext.toLowerCase()

    if (/enterprise|unlimited|priority|dedicated|custom/.test(lowerText) || /enterprise|business/.test(lowerPlan)) {
      return "enterprise"
    }
    if (/premium|advanced|pro/.test(lowerText) || /pro|premium|plus/.test(lowerPlan)) {
      return "premium"
    }
    if (/addon|add-on|extra|additional/.test(lowerText)) {
      return "addon"
    }
    return "core"
  }

  private isValidFeature(text: string): boolean {
    // Filter out navigation items, footers, etc.
    const invalidPatterns = /^(home|about|contact|login|signup|privacy|terms|cookie|©|copyright)$/i
    return !invalidPatterns.test(text.trim())
  }

  private classifyDiscountType(text: string): DiscountInfo["type"] {
    if (/%/.test(text)) return "percentage"
    if (/\$/.test(text)) return "fixed"
    if (/buy.*get.*free|bogo/i.test(text)) return "bogo"
    if (/free.*shipping/i.test(text)) return "free_shipping"
    if (/limited.*time|expires?|until/i.test(text)) return "limited_time"
    return "percentage"
  }

  private extractExpiryDate(text: string): string | undefined {
    const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|until\s+\w+\s+\d+)/i)
    return dateMatch ? dateMatch[0] : undefined
  }

  private extractDiscountFromContext(element: cheerio.Cheerio<cheerio.Element>): string {
    const text = element.text()
    const percentMatch = text.match(/(\d+)%/)
    if (percentMatch) return `${percentMatch[1]}%`

    const dollarMatch = text.match(/\$(\d+(?:\.\d{2})?)/)
    if (dollarMatch) return `$${dollarMatch[1]}`

    return "See details"
  }

  private extractTermsFromContext(element: cheerio.Cheerio<cheerio.Element>): string | undefined {
    const text = element.text()
    const termsMatch = text.match(/(minimum|expires?|valid|terms|conditions).{0,50}/i)
    return termsMatch ? termsMatch[0] : undefined
  }

  private classifyPageType(url: string): PageInfo["type"] {
    const urlLower = url.toLowerCase()
    if (/pricing/.test(urlLower)) return "pricing"
    if (/plans/.test(urlLower)) return "plans"
    if (/features/.test(urlLower)) return "features"
    if (/offers|deals/.test(urlLower)) return "offers"
    if (/coupons/.test(urlLower)) return "coupons"
    return "pricing"
  }

  private deduplicatePricing(pricing: EnhancedPricingInfo[]): EnhancedPricingInfo[] {
    const seen = new Set<string>()
    return pricing.filter((item) => {
      const key = `${item.price}-${item.plan}-${item.period}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private deduplicateCoupons(coupons: CouponInfo[]): CouponInfo[] {
    const seen = new Set<string>()
    return coupons.filter((item) => {
      if (seen.has(item.code)) return false
      seen.add(item.code)
      return true
    })
  }

  private deduplicateDiscounts(discounts: DiscountInfo[]): DiscountInfo[] {
    const seen = new Set<string>()
    return discounts.filter((item) => {
      const key = `${item.percentage}-${item.amount}-${item.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
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

  private detectCurrency(price: string): string {
    if (price.includes("$")) return "USD"
    if (price.includes("€")) return "EUR"
    if (price.includes("£")) return "GBP"
    if (price.includes("₹")) return "INR"
    return "USD"
  }

  private detectPeriod(text: string): string | undefined {
    if (/month|monthly|\/mo/i.test(text)) return "monthly"
    if (/year|yearly|annual|\/yr/i.test(text)) return "yearly"
    if (/week|weekly/i.test(text)) return "weekly"
    if (/day|daily/i.test(text)) return "daily"
    return undefined
  }

  private classifyButton(text: string, href?: string): ButtonInfo["type"] {
    const lowerText = text.toLowerCase()

    if (/sign up|register|join|create account/i.test(text)) return "signup"
    if (/demo|try|preview|test/i.test(text)) return "demo"
    if (/download|install/i.test(text)) return "download"
    if (/price|pricing|buy|purchase|order|subscribe|upgrade/i.test(text)) return "pricing"
    if (/get started|start|begin|learn more|contact|request/i.test(text)) return "cta"

    return "cta"
  }
}
