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
    dataQuality: number
    sources: string[]
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

export class EnhancedProductionScraper {
  private userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ]

  private proxyList = [
    // Add proxy endpoints here for production use
    // "http://proxy1.example.com:8080",
    // "http://proxy2.example.com:8080",
  ]

  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private rateLimiter = new Map<string, number>()

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  private getRandomProxy(): string | undefined {
    if (this.proxyList.length === 0) return undefined
    return this.proxyList[Math.floor(Math.random() * this.proxyList.length)]
  }

  private async respectRateLimit(domain: string): Promise<void> {
    const lastRequest = this.rateLimiter.get(domain) || 0
    const minInterval = 2000 // 2 seconds between requests to same domain
    const timeSinceLastRequest = Date.now() - lastRequest

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      console.log(`[v0] Rate limiting: waiting ${waitTime}ms for ${domain}`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.rateLimiter.set(domain, Date.now())
  }

  private getCachedData(url: string): any | null {
    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[v0] Using cached data for ${url}`)
      return cached.data
    }
    return null
  }

  private setCachedData(url: string, data: any, ttlMinutes = 30): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    })
  }

  private async fetchWithEnhancedOptions(url: string, maxRetries = 3): Promise<string> {
    // Check cache first
    const cachedData = this.getCachedData(url)
    if (cachedData) return cachedData

    const domain = new URL(url).hostname
    await this.respectRateLimit(domain)

    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[v0] Enhanced fetch attempt ${i + 1}: ${url}`)

        const proxy = this.getRandomProxy()
        const fetchOptions: RequestInit = {
          headers: {
            "User-Agent": this.getRandomUserAgent(),
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,es;q=0.8,fr;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          redirect: "follow",
        }

        // Add proxy if available
        if (proxy) {
          // Note: In production, you'd configure proxy through fetch options or use a proxy library
          console.log(`[v0] Using proxy: ${proxy}`)
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const html = await response.text()
        console.log(`[v0] Successfully fetched ${url} (${html.length} chars)`)

        // Cache successful response
        this.setCachedData(url, html)
        return html
      } catch (error) {
        console.log(`[v0] Enhanced fetch attempt ${i + 1} failed: ${error}`)
        if (i === maxRetries - 1) throw error

        // Exponential backoff with jitter
        const backoffTime = 1000 * Math.pow(2, i) + Math.random() * 1000
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
      }
    }
    throw new Error("Max retries exceeded")
  }

  private async tryAlternativeDataSources(url: string): Promise<any[]> {
    const alternativeSources = []
    const domain = new URL(url).hostname

    try {
      const html = await this.fetchWithEnhancedOptions(url)
      const $ = cheerio.load(html)

      // Extract JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, script) => {
        try {
          const jsonData = JSON.parse($(script).html() || "{}")
          if (jsonData["@type"] === "Product" || jsonData["@type"] === "Offer") {
            alternativeSources.push({
              source: "json-ld",
              data: jsonData,
              confidence: 0.9,
            })
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      })

      // Extract microdata
      $('[itemtype*="schema.org/Product"], [itemtype*="schema.org/Offer"]').each((_, element) => {
        const $el = $(element)
        const productData = {
          name: $el.find('[itemprop="name"]').text(),
          price: $el.find('[itemprop="price"]').text(),
          description: $el.find('[itemprop="description"]').text(),
        }
        if (productData.name || productData.price) {
          alternativeSources.push({
            source: "microdata",
            data: productData,
            confidence: 0.8,
          })
        }
      })

      $('link[type="application/rss+xml"], link[type="application/atom+xml"]').each((_, link) => {
        const feedUrl = $(link).attr("href")
        if (feedUrl) {
          alternativeSources.push({
            source: "feed",
            data: { feedUrl: new URL(feedUrl, url).toString() },
            confidence: 0.6,
          })
        }
      })

      const scriptContent = $("script").text()
      const apiMatches = scriptContent.match(/(?:api|endpoint)["']?\s*:\s*["']([^"']+)["']/gi)
      if (apiMatches) {
        apiMatches.forEach((match) => {
          const apiUrl = match.match(/["']([^"']+)["']/)?.[1]
          if (apiUrl && (apiUrl.includes("price") || apiUrl.includes("product"))) {
            alternativeSources.push({
              source: "api-endpoint",
              data: { apiUrl },
              confidence: 0.7,
            })
          }
        })
      }
    } catch (error) {
      console.log(`[v0] Alternative data source extraction failed: ${error}`)
    }

    return alternativeSources
  }

  private async tryWaybackMachine(url: string): Promise<any | null> {
    try {
      const waybackUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=5`
      const response = await fetch(waybackUrl)
      const data = await response.json()

      if (data && data.length > 1) {
        const snapshots = data.slice(1).map((snapshot: any[]) => ({
          timestamp: snapshot[1],
          url: `https://web.archive.org/web/${snapshot[1]}/${snapshot[2]}`,
          status: snapshot[4],
        }))

        return {
          source: "wayback-machine",
          snapshots,
          confidence: 0.5,
        }
      }
    } catch (error) {
      console.log(`[v0] Wayback Machine lookup failed: ${error}`)
    }
    return null
  }

  private calculateDataQuality(data: ScrapedData): number {
    let qualityScore = 0
    let maxScore = 0

    // Pricing quality (40% weight)
    maxScore += 40
    if (data.pricing.length > 0) {
      const avgConfidence = data.pricing.reduce((sum, p) => sum + p.confidence, 0) / data.pricing.length
      qualityScore += avgConfidence * 40
    }

    // Feature quality (25% weight)
    maxScore += 25
    if (data.features.length > 0) {
      const avgConfidence = data.features.reduce((sum, f) => sum + f.confidence, 0) / data.features.length
      qualityScore += avgConfidence * 25
    }

    // Content completeness (20% weight)
    maxScore += 20
    const hasTitle = data.title && data.title !== "No title found" ? 5 : 0
    const hasDescription = data.description && data.description !== "No description found" ? 5 : 0
    const hasMultipleDataTypes = [data.pricing, data.coupons, data.discounts, data.features, data.buttons].filter(
      (arr) => arr.length > 0,
    ).length
    qualityScore += hasTitle + hasDescription + hasMultipleDataTypes * 2

    // Data diversity (15% weight)
    maxScore += 15
    const dataTypeCount = [
      data.pricing.length > 0,
      data.coupons.length > 0,
      data.discounts.length > 0,
      data.features.length > 0,
      data.buttons.length > 0,
    ].filter(Boolean).length
    qualityScore += (dataTypeCount / 5) * 15

    return Math.min(100, (qualityScore / maxScore) * 100)
  }

  async scrapeWebsiteEnhanced(url: string): Promise<ScrapedData> {
    const startTime = Date.now()
    console.log(`[v0] Starting enhanced production scrape for: ${url}`)

    try {
      const [htmlContent, alternativeSources, historicalData] = await Promise.allSettled([
        this.fetchWithEnhancedOptions(url),
        this.tryAlternativeDataSources(url),
        this.tryWaybackMachine(url),
      ])

      let html = ""
      const sources = ["html-scraping"]

      if (htmlContent.status === "fulfilled") {
        html = htmlContent.value
      } else {
        throw new Error(`Failed to fetch main content: ${htmlContent.reason}`)
      }

      // Process alternative sources
      if (alternativeSources.status === "fulfilled") {
        alternativeSources.value.forEach((source) => {
          sources.push(source.source)
          console.log(`[v0] Found alternative data source: ${source.source} (confidence: ${source.confidence})`)
        })
      }

      if (historicalData.status === "fulfilled" && historicalData.value) {
        sources.push("wayback-machine")
        console.log(`[v0] Found historical data with ${historicalData.value.snapshots?.length || 0} snapshots`)
      }

      const $ = cheerio.load(html)

      // Remove script and style tags to avoid parsing JavaScript
      $("script, style, noscript, iframe, object, embed").remove()

      console.log(`[v0] Extracting data with enhanced algorithms...`)
      const pricing = this.extractEnhancedPricing($)
      const coupons = this.extractEnhancedCoupons($)
      const discounts = this.extractEnhancedDiscounts($)
      const features = this.extractEnhancedFeatures($)
      const buttons = this.extractEnhancedButtons($)

      const title = $("title").text().trim() || $("h1").first().text().trim() || "No title found"
      const description =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "No description available"

      const scrapedData: ScrapedData = {
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
          processingTime: Date.now() - startTime,
          dataQuality: 0, // Will be calculated below
          sources,
        },
      }

      scrapedData.metadata.dataQuality = this.calculateDataQuality(scrapedData)

      const processingTime = Date.now() - startTime
      console.log(`[v0] Enhanced scraping completed in ${processingTime}ms`)
      console.log(`[v0] Data quality score: ${scrapedData.metadata.dataQuality.toFixed(1)}%`)
      console.log(`[v0] Sources used: ${sources.join(", ")}`)
      console.log(
        `[v0] Found: ${pricing.length} pricing items, ${coupons.length} coupons, ${discounts.length} discounts, ${features.length} features, ${buttons.length} buttons`,
      )

      return scrapedData
    } catch (error) {
      console.error(`[v0] Enhanced scraping failed: ${error}`)
      throw new Error(`Failed to scrape website: ${error}`)
    }
  }

  private extractEnhancedPricing($: cheerio.CheerioAPI): PricingItem[] {
    const pricing: PricingItem[] = []

    // Enhanced pricing selectors with better specificity
    const pricingSelectors = [
      '[class*="price"]:not(script):not(style):not([class*="old"]):not([class*="was"])',
      '[class*="cost"]:not(script):not(style)',
      '[class*="plan"]:not(script):not(style)',
      '[data-testid*="price"], [data-price], [data-cost]',
      ".pricing-card, .plan-card, .subscription-card",
      '[class*="tier"]:not(script):not(style)',
      '[itemtype*="schema.org/Offer"], [itemtype*="schema.org/Product"]',
    ]

    // Enhanced price patterns with better currency support
    const pricePatterns = [
      /(?:\$|USD\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:€|EUR\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(?:£|GBP\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(month|year|user|seat)/gi,
      /(?:from|starting\s+at|only)\s*[$€£]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    ]

    pricingSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Skip if element is too small, too large, or contains suspicious content
        if (text.length < 2 || text.length > 300 || this.containsSuspiciousContent(text)) {
          return
        }

        pricePatterns.forEach((pattern) => {
          const matches = text.match(pattern)
          if (matches) {
            matches.forEach((match) => {
              const cleanPrice = this.cleanPrice(match)
              if (this.isValidPrice(cleanPrice, text)) {
                const planName = this.extractPlanName($, $el, text)
                const features = this.extractPlanFeatures($, $el)
                const billing = this.extractBillingPeriod(text)
                const category = this.categorizePricing(text, planName)
                const confidence = this.calculatePricingConfidence(text, $el)

                pricing.push({
                  price: cleanPrice,
                  plan: planName,
                  features,
                  billing,
                  category,
                  confidence,
                })
              }
            })
          }
        })
      })
    })

    // Remove duplicates and low confidence items, sort by confidence
    return pricing
      .filter(
        (item, index, self) =>
          item.confidence > 0.4 && self.findIndex((p) => p.price === item.price && p.plan === item.plan) === index,
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12)
  }

  private containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = [
      /function\s*\(/,
      /var\s+\w+\s*=/,
      /\|\||&&/,
      /return\s+/,
      /console\./,
      /document\./,
      /window\./,
      /\$\{|\}\$/,
      /\d{10,}/, // Very long numbers (likely IDs or timestamps)
    ]

    return suspiciousPatterns.some((pattern) => pattern.test(text))
  }

  private cleanPrice(price: string): string {
    return price.replace(/[^\d.,]/g, "").replace(/,/g, "")
  }

  private isValidPrice(price: string, context: string): boolean {
    const numPrice = Number.parseFloat(price)
    if (numPrice < 0.01 || numPrice > 50000) return false
    if (price.length < 1) return false
    if (this.containsSuspiciousContent(context)) return false
    return true
  }

  private extractPlanName($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>, text: string): string {
    // Look for plan names in parent elements or nearby text
    const $parent = $el.closest('[class*="plan"], [class*="tier"], [class*="card"], [class*="package"]')
    const parentText = $parent.find('h1, h2, h3, h4, .title, [class*="name"], [class*="label"]').first().text().trim()

    if (parentText && !parentText.includes("$") && parentText.length < 50 && parentText.length > 2) {
      return parentText
    }

    // Extract from common plan name patterns with better regex
    const planMatch = text.match(
      /(Basic|Standard|Premium|Pro|Enterprise|Starter|Free|Plus|Advanced|Business|Individual|Team|Professional|Lite|Ultimate)/i,
    )
    return planMatch ? planMatch[1] : "Standard Plan"
  }

  private extractPlanFeatures($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>): string[] {
    const features: string[] = []
    const $container = $el.closest('[class*="plan"], [class*="tier"], [class*="card"], [class*="package"]')

    $container.find('li, [class*="feature"], [class*="benefit"], [class*="include"]').each((_, featureEl) => {
      const featureText = $(featureEl).text().trim()
      if (
        featureText &&
        featureText.length > 3 &&
        featureText.length < 120 &&
        !featureText.includes("$") &&
        !this.containsSuspiciousContent(featureText)
      ) {
        features.push(featureText)
      }
    })

    return features.slice(0, 8)
  }

  private extractBillingPeriod(text: string): string {
    const billingPatterns = [
      { pattern: /month|monthly|\/mo\b/i, value: "monthly" },
      { pattern: /year|yearly|annual|\/yr\b/i, value: "yearly" },
      { pattern: /week|weekly/i, value: "weekly" },
      { pattern: /day|daily/i, value: "daily" },
      { pattern: /one.?time|once/i, value: "one-time" },
    ]

    for (const { pattern, value } of billingPatterns) {
      if (pattern.test(text)) return value
    }

    return "one-time"
  }

  private categorizePricing(text: string, planName: string): PricingItem["category"] {
    const lowerText = (text + " " + planName).toLowerCase()

    if (/free|$0|no.?cost/i.test(lowerText)) return "freemium"
    if (/enterprise|custom|contact.?us|call.?us/i.test(lowerText)) return "enterprise"
    if (/usage|per.?request|per.?api|per.?call|pay.?as/i.test(lowerText)) return "usage-based"
    if (/month|year|subscription|recurring/i.test(lowerText)) return "subscription"

    return "one-time"
  }

  private calculatePricingConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.5

    // Increase confidence for pricing-specific contexts
    if ($el.closest('[class*="pricing"], [class*="plan"], [class*="cost"], [class*="tier"]').length) confidence += 0.25
    if (/month|year|plan|subscription|billing/i.test(text)) confidence += 0.15
    if ($el.find('[class*="currency"], [class*="symbol"]').length) confidence += 0.1
    if (/^\$\d+(\.\d{2})?$/.test(text.trim())) confidence += 0.2 // Clean price format

    // Decrease confidence for suspicious patterns
    if (this.containsSuspiciousContent(text)) confidence -= 0.6
    if (text.length > 150) confidence -= 0.2
    if ($el.is("script, style, noscript")) confidence -= 0.8

    return Math.max(0.1, Math.min(1, confidence))
  }

  // Enhanced extraction methods for other data types
  private extractEnhancedCoupons($: cheerio.CheerioAPI): CouponItem[] {
    const coupons: CouponItem[] = []

    const couponSelectors = [
      '[class*="coupon"]:not(script):not(style)',
      '[class*="promo"]:not(script):not(style)',
      '[class*="code"]:not(script):not(style)',
      "[data-coupon], [data-promo-code]",
      '[class*="discount-code"], [class*="voucher"]',
    ]

    couponSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Enhanced coupon code patterns
        const codePatterns = [
          /\b([A-Z0-9]{4,15})\b/g,
          /(?:code|coupon|promo):\s*([A-Z0-9]{3,20})/gi,
          /use\s+(?:code|coupon)\s+([A-Z0-9]{3,20})/gi,
        ]

        codePatterns.forEach((pattern) => {
          const matches = text.match(pattern)
          if (matches) {
            matches.forEach((match) => {
              const code = match.replace(/[^A-Z0-9]/g, "")
              if (code.length >= 3 && code.length <= 20 && !this.isCommonWord(code)) {
                const description = text.replace(match, "").trim() || "Discount code"
                const discountMatch = text.match(/(\d+%|\$\d+(?:\.\d{2})?)/i)

                coupons.push({
                  code,
                  description: description.substring(0, 100),
                  discount: discountMatch ? discountMatch[0] : "See details",
                  confidence: 0.75,
                })
              }
            })
          }
        })
      })
    })

    return coupons
      .filter((c, index, self) => c.confidence > 0.5 && self.findIndex((coupon) => coupon.code === c.code) === index)
      .slice(0, 8)
  }

  private isCommonWord(code: string): boolean {
    const commonWords = ["HOME", "ABOUT", "CONTACT", "LOGIN", "SIGNUP", "MENU", "SEARCH", "CART", "HELP"]
    return commonWords.includes(code.toUpperCase())
  }

  private extractEnhancedDiscounts($: cheerio.CheerioAPI): DiscountItem[] {
    const discounts: DiscountItem[] = []

    const discountSelectors = [
      '[class*="discount"]:not(script):not(style)',
      '[class*="sale"]:not(script):not(style)',
      '[class*="offer"]:not(script):not(style)',
      '[class*="deal"]:not(script):not(style)',
      '[class*="promo"]:not(script):not(style)',
      '[class*="special"]:not(script):not(style)',
      '[class*="save"]:not(script):not(style)',
    ]

    discountSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        if (text.length < 5 || text.length > 200) return

        // Enhanced discount patterns
        const discountPatterns = [
          { pattern: /(\d+)%\s*(?:off|discount|save)/gi, type: "percentage" as const },
          { pattern: /save\s*(\d+)%/gi, type: "percentage" as const },
          { pattern: /(?:\$|€|£)(\d+(?:\.\d{2})?)\s*(?:off|discount|save)/gi, type: "fixed" as const },
          { pattern: /buy\s*\d+\s*get\s*\d+\s*free/gi, type: "bogo" as const },
          { pattern: /free\s*(?:trial|month|week|shipping)/gi, type: "free-trial" as const },
        ]

        discountPatterns.forEach(({ pattern, type }) => {
          const matches = text.match(pattern)
          if (matches) {
            matches.forEach((match) => {
              const percentageMatch = match.match(/(\d+)%/)
              const percentage = percentageMatch ? percentageMatch[1] + "%" : match

              discounts.push({
                text: text.substring(0, 120),
                percentage,
                type,
                confidence: 0.8,
              })
            })
          }
        })
      })
    })

    return discounts
      .filter(
        (d, index, self) => d.confidence > 0.6 && self.findIndex((discount) => discount.text === d.text) === index,
      )
      .slice(0, 10)
  }

  private extractEnhancedFeatures($: cheerio.CheerioAPI): FeatureItem[] {
    const features: FeatureItem[] = []

    // Enhanced feature selectors
    const featureSelectors = [
      "li:not(nav li):not(footer li)",
      '[class*="feature"]:not(script):not(style)',
      '[class*="benefit"]:not(script):not(style)',
      '[class*="capability"]:not(script):not(style)',
      '[class*="include"]:not(script):not(style)',
      '[class*="spec"]:not(script):not(style)',
    ]

    featureSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()

        // Enhanced feature validation
        if (this.isValidFeature(text, $el)) {
          const category = this.categorizeFeature(text)
          const confidence = this.calculateFeatureConfidence(text, $el)

          if (confidence > 0.4) {
            features.push({
              text,
              category,
              confidence,
            })
          }
        }
      })
    })

    return features
      .filter((item, index, self) => self.findIndex((f) => f.text === item.text) === index)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 25)
  }

  private isValidFeature(text: string, $el: cheerio.Cheerio<cheerio.Element>): boolean {
    // Enhanced feature validation
    if (text.length < 5 || text.length > 200) return false

    // Skip navigation, footer, and other non-content elements
    if ($el.closest("nav, footer, header, .navigation, .menu").length) return false

    // Skip common non-feature patterns
    const invalidPatterns = [
      /^(home|about|contact|login|signup|privacy|terms|cookie|©|copyright)$/i,
      /^(search|cart|menu|toggle|close|open)$/i,
      /^\d+$/, // Just numbers
      /^[^\w\s]+$/, // Just symbols
      /javascript:|onclick=/i, // JavaScript
    ]

    return !invalidPatterns.some((pattern) => pattern.test(text.trim()))
  }

  private categorizeFeature(text: string): FeatureItem["category"] {
    const lowerText = text.toLowerCase()

    const categoryPatterns = [
      {
        patterns: [/enterprise|unlimited|priority|dedicated|custom|advanced|professional/],
        category: "enterprise" as const,
      },
      { patterns: [/premium|pro|plus|enhanced|extended/], category: "premium" as const },
      { patterns: [/addon|add-on|extension|plugin|extra|additional/], category: "addon" as const },
    ]

    for (const { patterns, category } of categoryPatterns) {
      if (patterns.some((pattern) => pattern.test(lowerText))) {
        return category
      }
    }

    return "core"
  }

  private calculateFeatureConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.5

    // Increase confidence for feature-specific contexts
    if ($el.closest('[class*="feature"], [class*="benefit"], ul, ol').length) confidence += 0.2
    if (/^[A-Z]/.test(text) && text.length > 8) confidence += 0.15 // Proper sentence structure
    if ($el.find('svg, i[class*="icon"], [class*="check"]').length) confidence += 0.1 // Has icons

    // Decrease confidence for suspicious patterns
    if (this.containsSuspiciousContent(text)) confidence -= 0.5
    if ($el.is("script, style, noscript")) confidence -= 0.8

    return Math.max(0.1, Math.min(1, confidence))
  }

  private extractEnhancedButtons($: cheerio.CheerioAPI): ButtonItem[] {
    const buttons: ButtonItem[] = []

    const buttonSelectors = [
      'button:not([type="hidden"]):not([style*="display: none"])',
      '[role="button"]',
      '.btn, [class*="button"]',
      'a[class*="cta"]',
      'input[type="submit"]',
      '[class*="call-to-action"]',
    ]

    buttonSelectors.forEach((selector) => {
      $(selector).each((_, element) => {
        const $el = $(element)
        const text = $el.text().trim()
        const href = $el.attr("href")

        if (text && text.length > 0 && text.length < 60 && this.isValidButton(text, $el)) {
          const type = this.categorizeButton(text)
          const confidence = this.calculateButtonConfidence(text, $el)

          if (confidence > 0.5) {
            buttons.push({
              text,
              type,
              url: href,
              confidence,
            })
          }
        }
      })
    })

    return buttons
      .filter((item, index, self) => self.findIndex((b) => b.text === item.text) === index)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 18)
  }

  private isValidButton(text: string, $el: cheerio.Cheerio<cheerio.Element>): boolean {
    // Skip navigation and footer buttons
    if ($el.closest("nav, footer, .navigation, .menu").length) return false

    // Skip common non-CTA buttons
    const invalidButtonPatterns = [
      /^(home|about|privacy|terms|cookies?)$/i,
      /^(×|✕|close|cancel)$/i,
      /^(←|→|prev|next|back)$/i,
    ]

    return !invalidButtonPatterns.some((pattern) => pattern.test(text.trim()))
  }

  private categorizeButton(text: string): ButtonItem["type"] {
    const lowerText = text.toLowerCase()

    const buttonCategories = [
      { patterns: [/sign.?up|register|join|create.?account/], type: "signup" as const },
      { patterns: [/trial|try|demo|preview|test/], type: "trial" as const },
      { patterns: [/buy|purchase|order|subscribe|upgrade|checkout/], type: "purchase" as const },
      { patterns: [/contact|talk|call|chat|support|help/], type: "contact" as const },
    ]

    for (const { patterns, type } of buttonCategories) {
      if (patterns.some((pattern) => pattern.test(lowerText))) {
        return type
      }
    }

    return "cta"
  }

  private calculateButtonConfidence(text: string, $el: cheerio.Cheerio<cheerio.Element>): number {
    let confidence = 0.6

    // Increase confidence for CTA-specific contexts
    if ($el.hasClass("cta") || $el.hasClass("primary") || $el.hasClass("btn-primary")) confidence += 0.2
    if (/get.?started|sign.?up|try|buy|contact/i.test(text)) confidence += 0.15
    if ($el.closest('[class*="hero"], [class*="banner"], [class*="cta"]').length) confidence += 0.1

    // Decrease confidence for navigation
    if ($el.closest("nav, header, footer").length) confidence -= 0.2

    return Math.max(0.1, Math.min(1, confidence))
  }
}
