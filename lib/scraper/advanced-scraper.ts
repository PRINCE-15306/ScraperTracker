import * as cheerio from "cheerio"

interface ScrapedData {
  title: string
  description: string
  pricing: PricingItem[]
  coupons: CouponItem[]
  discounts: DiscountItem[]
  features: FeatureItem[]
  buttons: ButtonItem[]
  metadata: {
    url: string
    scrapedAt: string
    pagesScraped: number
    processingTime: number
  }
}

interface PricingItem {
  price: string
  plan: string
  features: string[]
  billing: string
  category: "subscription" | "one-time" | "usage-based" | "freemium" | "enterprise"
  confidence: number
}

interface CouponItem {
  code: string
  description: string
  discount: string
  expiry?: string
  confidence: number
}

interface DiscountItem {
  text: string
  percentage: string
  type: "percentage" | "fixed" | "bogo" | "free-trial"
  conditions?: string
  confidence: number
}

interface FeatureItem {
  text: string
  category: "core" | "premium" | "enterprise" | "addon"
  confidence: number
}

interface ButtonItem {
  text: string
  type: "cta" | "signup" | "trial" | "purchase" | "contact"
  url?: string
  confidence: number
}

export class AdvancedScraper {
  private userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  ]

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  private async fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[v0] Attempt ${i + 1}: Fetching ${url}`)

        const response = await fetch(url, {
          headers: {
            "User-Agent": this.getRandomUserAgent(),
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
          },
          redirect: "follow",
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const html = await response.text()
        console.log(`[v0] Successfully fetched ${url} (${html.length} chars)`)
        return html
      } catch (error) {
        console.log(`[v0] Attempt ${i + 1} failed: ${error}`)
        if (i === maxRetries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
    throw new Error("Max retries exceeded")
  }

  private extractPricing($: cheerio.CheerioAPI): PricingItem[] {
    const pricing: PricingItem[] = []

    // Enhanced pricing selectors
    const pricingSelectors = [
      '[class*="price"]',
      '[class*="cost"]',
      '[class*="plan"]',
      '[data-testid*="price"]',
      "[data-price]",
      ".pricing-card",
      ".plan-card",
      ".subscription",
      '[class*="tier"]',
    ]

    pricingSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Enhanced price pattern matching
        const priceMatches = text.match(
          /(?:\$|€|£|₹|¥)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)|(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\$|€|£|₹|¥)/g,
        )

        if (priceMatches && priceMatches.length > 0) {
          priceMatches.forEach((priceMatch) => {
            // Skip if it's clearly JavaScript or invalid
            if (text.includes("function") || text.includes("var ") || text.includes("||") || priceMatch === "$,") {
              return
            }

            const planName = this.extractPlanName($, $el, text)
            const features = this.extractPlanFeatures($, $el)
            const billing = this.extractBillingPeriod(text)
            const category = this.categorizePricing(text, planName)

            pricing.push({
              price: priceMatch.trim(),
              plan: planName,
              features,
              billing,
              category,
              confidence: this.calculatePricingConfidence(text, $el),
            })
          })
        }
      })
    })

    // Remove duplicates and low confidence items
    return pricing
      .filter(
        (item, index, self) =>
          item.confidence > 0.3 && self.findIndex((p) => p.price === item.price && p.plan === item.plan) === index,
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10) // Limit to top 10 most confident results
  }

  private extractPlanName($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>, text: string): string {
    // Look for plan names in parent elements or nearby text
    const $parent = $el.closest('[class*="plan"], [class*="tier"], [class*="card"]')
    const parentText = $parent.find('h1, h2, h3, h4, .title, [class*="name"]').first().text().trim()

    if (parentText && !parentText.includes("$") && parentText.length < 50) {
      return parentText
    }

    // Extract from common plan name patterns
    const planMatch = text.match(
      /(Basic|Standard|Premium|Pro|Enterprise|Starter|Free|Plus|Advanced|Business|Individual|Team|Professional)/i,
    )
    return planMatch ? planMatch[1] : "Unknown Plan"
  }

  private extractPlanFeatures($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string[] {
    const features: string[] = []
    const $container = $el.closest('[class*="plan"], [class*="tier"], [class*="card"]')

    $container.find('li, [class*="feature"], [class*="benefit"]').each((_, featureEl) => {
      const featureText = $(featureEl).text().trim()
      if (featureText && featureText.length < 100 && !featureText.includes("$")) {
        features.push(featureText)
      }
    })

    return features.slice(0, 5) // Limit to 5 features per plan
  }

  private extractBillingPeriod(text: string): string {
    const billingMatch = text.match(/(month|year|week|day|annual|monthly|weekly|daily|per|\/)/i)
    if (billingMatch) {
      if (text.includes("month") || text.includes("/mo")) return "monthly"
      if (text.includes("year") || text.includes("annual") || text.includes("/yr")) return "yearly"
      if (text.includes("week")) return "weekly"
      if (text.includes("day")) return "daily"
    }
    return "one-time"
  }

  private categorizePricing(text: string, planName: string): PricingItem["category"] {
    const lowerText = (text + " " + planName).toLowerCase()

    if (lowerText.includes("free") || lowerText.includes("$0")) return "freemium"
    if (lowerText.includes("enterprise") || lowerText.includes("custom")) return "enterprise"
    if (lowerText.includes("usage") || lowerText.includes("per ") || lowerText.includes("api")) return "usage-based"
    if (lowerText.includes("month") || lowerText.includes("year") || lowerText.includes("subscription"))
      return "subscription"

    return "one-time"
  }

  private calculatePricingConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.5

    // Increase confidence for pricing-specific contexts
    if ($el.closest('[class*="pricing"], [class*="plan"], [class*="cost"]').length) confidence += 0.3
    if (text.match(/(month|year|plan|subscription)/i)) confidence += 0.2
    if ($el.find('[class*="currency"], [class*="symbol"]').length) confidence += 0.2

    // Decrease confidence for suspicious patterns
    if (text.includes("function") || text.includes("var ") || text.includes("||")) confidence -= 0.8
    if (text.length > 200) confidence -= 0.3
    if ($el.is("script, style, noscript")) confidence -= 0.9

    return Math.max(0, Math.min(1, confidence))
  }

  private extractCoupons($: cheerio.CheerioAPI): CouponItem[] {
    const coupons: CouponItem[] = []

    const couponSelectors = [
      '[class*="coupon"]',
      '[class*="promo"]',
      '[class*="code"]',
      "[data-coupon]",
      '[class*="discount-code"]',
    ]

    couponSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Look for coupon codes (usually uppercase alphanumeric)
        const codeMatch = text.match(/\b[A-Z0-9]{4,15}\b/)
        if (codeMatch) {
          const description = text.replace(codeMatch[0], "").trim()
          const discountMatch = text.match(/(\d+%|\$\d+)/)

          coupons.push({
            code: codeMatch[0],
            description: description || "Discount code",
            discount: discountMatch ? discountMatch[0] : "Unknown discount",
            confidence: 0.8,
          })
        }
      })
    })

    return coupons.filter((c) => c.confidence > 0.5)
  }

  private extractDiscounts($: cheerio.CheerioAPI): DiscountItem[] {
    const discounts: DiscountItem[] = []

    const discountSelectors = [
      '[class*="discount"]',
      '[class*="sale"]',
      '[class*="offer"]',
      '[class*="deal"]',
      '[class*="promo"]',
      '[class*="special"]',
    ]

    discountSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Look for percentage discounts
        const percentMatch = text.match(/(\d+)%\s*(off|discount|save)/i)
        if (percentMatch) {
          discounts.push({
            text: text.substring(0, 100),
            percentage: percentMatch[1] + "%",
            type: "percentage",
            confidence: 0.8,
          })
        }

        // Look for fixed amount discounts
        const fixedMatch = text.match(/(?:\$|€|£|₹)(\d+)\s*(off|discount|save)/i)
        if (fixedMatch) {
          discounts.push({
            text: text.substring(0, 100),
            percentage: fixedMatch[0],
            type: "fixed",
            confidence: 0.8,
          })
        }

        // Look for free trial offers
        if (text.match(/free\s*(trial|month|week|day)/i)) {
          discounts.push({
            text: text.substring(0, 100),
            percentage: "Free Trial",
            type: "free-trial",
            confidence: 0.7,
          })
        }
      })
    })

    return discounts.filter((d) => d.confidence > 0.5)
  }

  private extractFeatures($: cheerio.CheerioAPI): FeatureItem[] {
    const features: FeatureItem[] = []

    // Look for feature lists and descriptions
    $('li, [class*="feature"], [class*="benefit"], [class*="capability"]').each((_, element) => {
      const $el = $(element)
      const text = $el.text().trim()

      // Skip if it's navigation, footer, or other non-content
      if (
        text.length > 5 &&
        text.length < 150 &&
        !text.includes("©") &&
        !text.includes("Privacy") &&
        !text.includes("Terms") &&
        !$el.closest("nav, footer, header").length
      ) {
        const category = this.categorizeFeature(text)
        const confidence = this.calculateFeatureConfidence(text, $el)

        if (confidence > 0.3) {
          features.push({
            text,
            category,
            confidence,
          })
        }
      }
    })

    return features
      .filter((item, index, self) => self.findIndex((f) => f.text === item.text) === index)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)
  }

  private categorizeFeature(text: string): FeatureItem["category"] {
    const lowerText = text.toLowerCase()

    if (lowerText.includes("enterprise") || lowerText.includes("advanced") || lowerText.includes("unlimited"))
      return "enterprise"
    if (lowerText.includes("premium") || lowerText.includes("pro") || lowerText.includes("plus")) return "premium"
    if (lowerText.includes("addon") || lowerText.includes("add-on") || lowerText.includes("extension")) return "addon"

    return "core"
  }

  private calculateFeatureConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.5

    // Increase confidence for feature-specific contexts
    if ($el.closest('[class*="feature"], [class*="benefit"], ul, ol').length) confidence += 0.3
    if (text.match(/^[A-Z]/) && text.length > 10) confidence += 0.2 // Proper sentence structure

    // Decrease confidence for suspicious patterns
    if (text.includes("alt +") || text.includes("shift +")) confidence -= 0.8 // Accessibility shortcuts
    if (text.match(/^(Search|Cart|Home|Main content)$/)) confidence -= 0.7 // Navigation elements
    if ($el.is("script, style, noscript")) confidence -= 0.9

    return Math.max(0, Math.min(1, confidence))
  }

  private extractButtons($: cheerio.CheerioAPI): ButtonItem[] {
    const buttons: ButtonItem[] = []

    $('button, [role="button"], .btn, [class*="button"], a[class*="cta"]').each((_, element) => {
      const $el = $(element)
      const text = $el.text().trim()
      const href = $el.attr("href")

      if (text && text.length < 50) {
        const type = this.categorizeButton(text)
        const confidence = this.calculateButtonConfidence(text, $el)

        if (confidence > 0.4) {
          buttons.push({
            text,
            type,
            url: href,
            confidence,
          })
        }
      }
    })

    return buttons
      .filter((item, index, self) => self.findIndex((b) => b.text === item.text) === index)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15)
  }

  private categorizeButton(text: string): ButtonItem["type"] {
    const lowerText = text.toLowerCase()

    if (lowerText.includes("sign up") || lowerText.includes("register") || lowerText.includes("join")) return "signup"
    if (lowerText.includes("trial") || lowerText.includes("try") || lowerText.includes("demo")) return "trial"
    if (lowerText.includes("buy") || lowerText.includes("purchase") || lowerText.includes("order")) return "purchase"
    if (lowerText.includes("contact") || lowerText.includes("talk") || lowerText.includes("call")) return "contact"
    if (lowerText.includes("get started") || lowerText.includes("start") || lowerText.includes("begin")) return "cta"

    return "cta"
  }

  private calculateButtonConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.6

    // Increase confidence for CTA-specific contexts
    if ($el.hasClass("cta") || $el.hasClass("primary") || $el.hasClass("btn-primary")) confidence += 0.3
    if (text.match(/(get started|sign up|try|buy|contact)/i)) confidence += 0.2

    // Decrease confidence for navigation
    if ($el.closest("nav, header, footer").length) confidence -= 0.3
    if (text.match(/^(home|about|contact|privacy|terms)$/i)) confidence -= 0.4

    return Math.max(0, Math.min(1, confidence))
  }

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    const startTime = Date.now()
    console.log(`[v0] Starting advanced scrape for: ${url}`)

    try {
      const html = await this.fetchWithRetry(url)
      const $ = cheerio.load(html)

      // Remove script and style tags to avoid parsing JavaScript
      $("script, style, noscript").remove()

      console.log(`[v0] Extracting pricing information...`)
      const pricing = this.extractPricing($)

      console.log(`[v0] Extracting coupons and discounts...`)
      const coupons = this.extractCoupons($)
      const discounts = this.extractDiscounts($)

      console.log(`[v0] Extracting features and buttons...`)
      const features = this.extractFeatures($)
      const buttons = this.extractButtons($)

      const title = $("title").text().trim() || $("h1").first().text().trim() || "No title found"
      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "No description available"

      const processingTime = Date.now() - startTime
      console.log(`[v0] Scraping completed in ${processingTime}ms`)
      console.log(
        `[v0] Found: ${pricing.length} pricing items, ${coupons.length} coupons, ${discounts.length} discounts, ${features.length} features, ${buttons.length} buttons`,
      )

      return {
        title,
        description,
        pricing,
        coupons,
        discounts,
        features,
        buttons,
        metadata: {
          url,
          scrapedAt: new Date().toISOString(),
          pagesScraped: 1,
          processingTime,
        },
      }
    } catch (error) {
      console.error(`[v0] Scraping failed: ${error}`)
      throw new Error(`Failed to scrape website: ${error}`)
    }
  }
}
