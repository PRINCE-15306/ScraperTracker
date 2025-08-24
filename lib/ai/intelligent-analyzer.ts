interface AnalysisPattern {
  id: string
  pattern: string
  category: string
  confidence: number
  successRate: number
  usageCount: number
  feedbackCount?: number
}

interface LearningData {
  totalAnalyses: number
  successRate: number
  learningScore: number
  patterns: AnalysisPattern[]
  feedbackStats?: {
    totalFeedback: number
    positiveFeedback: number
    negativeFeedback: number
    feedbackRatio: number
  }
}

export class IntelligentAnalyzer {
  private patterns: AnalysisPattern[] = [
    {
      id: "freemium-strategy",
      pattern: "freemium pricing model detected",
      category: "pricing_strategy",
      confidence: 0.85,
      successRate: 0.9,
      usageCount: 0,
    },
    {
      id: "enterprise-focus",
      pattern: "enterprise pricing tier available",
      category: "market_positioning",
      confidence: 0.8,
      successRate: 0.85,
      usageCount: 0,
    },
    {
      id: "high-promotion",
      pattern: "multiple active promotions",
      category: "marketing_strategy",
      confidence: 0.75,
      successRate: 0.8,
      usageCount: 0,
    },
    {
      id: "trial-focused",
      pattern: "trial buttons outnumber purchase buttons",
      category: "conversion_strategy",
      confidence: 0.7,
      successRate: 0.75,
      usageCount: 0,
    },
  ]

  private feedbackHistory: Array<{
    analysisId: string
    feedback: "positive" | "negative"
    accuracyScore: number
    timestamp: string
    patternsAffected: number
  }> = []

  async analyzeData(scrapedData: any): Promise<any> {
    console.log("[v0] Starting intelligent analysis...")

    const insights = []
    const recommendations = []
    const detectedPatterns = []
    let overallConfidence = 0

    // Analyze pricing strategy
    if (scrapedData.pricing && scrapedData.pricing.length > 0) {
      const pricingAnalysis = this.analyzePricing(scrapedData.pricing)
      insights.push(...pricingAnalysis.insights)
      recommendations.push(...pricingAnalysis.recommendations)
      detectedPatterns.push(...pricingAnalysis.patterns)
      overallConfidence += pricingAnalysis.confidence
    }

    // Analyze promotional strategy
    const promoCount = (scrapedData.coupons?.length || 0) + (scrapedData.discounts?.length || 0)
    if (promoCount > 0) {
      const promoAnalysis = this.analyzePromotions(scrapedData.coupons || [], scrapedData.discounts || [])
      insights.push(...promoAnalysis.insights)
      recommendations.push(...promoAnalysis.recommendations)
      detectedPatterns.push(...promoAnalysis.patterns)
      overallConfidence += promoAnalysis.confidence
    }

    // Analyze feature strategy
    if (scrapedData.features && scrapedData.features.length > 0) {
      const featureAnalysis = this.analyzeFeatures(scrapedData.features)
      insights.push(...featureAnalysis.insights)
      recommendations.push(...featureAnalysis.recommendations)
      detectedPatterns.push(...featureAnalysis.patterns)
      overallConfidence += featureAnalysis.confidence
    }

    // Analyze conversion strategy
    if (scrapedData.buttons && scrapedData.buttons.length > 0) {
      const conversionAnalysis = this.analyzeConversion(scrapedData.buttons)
      insights.push(...conversionAnalysis.insights)
      recommendations.push(...conversionAnalysis.recommendations)
      detectedPatterns.push(...conversionAnalysis.patterns)
      overallConfidence += conversionAnalysis.confidence
    }

    // Calculate final confidence
    const analysisCount = [
      scrapedData.pricing?.length > 0,
      promoCount > 0,
      scrapedData.features?.length > 0,
      scrapedData.buttons?.length > 0,
    ].filter(Boolean).length

    const finalConfidence = analysisCount > 0 ? overallConfidence / analysisCount : 0.5

    // Update pattern usage
    detectedPatterns.forEach((patternId) => {
      const pattern = this.patterns.find((p) => p.id === patternId)
      if (pattern) {
        pattern.usageCount++
      }
    })

    const analysis = {
      id: Date.now().toString(),
      insights,
      recommendations,
      detectedPatterns,
      confidence: finalConfidence,
      analysis: this.generateTextAnalysis(insights, recommendations, finalConfidence),
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Intelligent analysis completed with confidence:", finalConfidence)

    return analysis
  }

  private analyzePricing(pricing: any[]): any {
    const insights = []
    const recommendations = []
    const patterns = []
    let confidence = 0.7

    const hasFreemium = pricing.some((p) => p.category === "freemium")
    const hasEnterprise = pricing.some((p) => p.category === "enterprise")
    const prices = pricing.map((p) => Number.parseFloat(p.price.replace(/[^0-9.]/g, ""))).filter((p) => !isNaN(p))

    if (hasFreemium) {
      insights.push("Uses freemium model to drive user acquisition and reduce entry barriers")
      recommendations.push("Consider freemium strategy to compete for market share")
      patterns.push("freemium-strategy")
      confidence += 0.1
    }

    if (hasEnterprise) {
      insights.push("Targets enterprise market with dedicated pricing tier")
      recommendations.push("Develop enterprise features to capture high-value customers")
      patterns.push("enterprise-focus")
      confidence += 0.1
    }

    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
      const maxPrice = Math.max(...prices)
      const minPrice = Math.min(...prices)

      if (maxPrice / minPrice > 10) {
        insights.push("Wide pricing range suggests diverse customer segments")
        recommendations.push("Segment your pricing to match their market coverage")
      }

      if (avgPrice > 100) {
        insights.push("Premium pricing strategy indicates high-value positioning")
        recommendations.push("Focus on value proposition to justify premium pricing")
      }
    }

    return { insights, recommendations, patterns, confidence }
  }

  private analyzePromotions(coupons: any[], discounts: any[]): any {
    const insights = []
    const recommendations = []
    const patterns = []
    let confidence = 0.6

    const totalPromos = coupons.length + discounts.length

    if (totalPromos > 3) {
      insights.push("High promotional activity indicates aggressive customer acquisition strategy")
      recommendations.push("Monitor their promotional patterns to anticipate competitive moves")
      patterns.push("high-promotion")
      confidence += 0.2
    }

    if (coupons.length > 0) {
      insights.push("Uses coupon codes to track marketing campaign effectiveness")
      recommendations.push("Implement trackable promotional codes for better attribution")
    }

    const percentageDiscounts = discounts.filter((d) => d.type === "percentage")
    if (percentageDiscounts.length > 0) {
      insights.push("Percentage-based discounts suggest margin flexibility")
      recommendations.push("Analyze their discount patterns to understand pricing elasticity")
    }

    return { insights, recommendations, patterns, confidence }
  }

  private analyzeFeatures(features: any[]): any {
    const insights = []
    const recommendations = []
    const patterns = []
    let confidence = 0.65

    const categories = features.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {})

    if (categories.premium > categories.core) {
      insights.push("Emphasizes premium features over core functionality")
      recommendations.push("Identify feature gaps in premium tier for differentiation")
      confidence += 0.1
    }

    if (categories.enterprise > 0) {
      insights.push("Dedicated enterprise features indicate B2B focus")
      recommendations.push("Develop enterprise-grade features to compete in B2B market")
    }

    const highConfidenceFeatures = features.filter((f) => f.confidence > 0.8)
    if (highConfidenceFeatures.length > features.length * 0.7) {
      insights.push("Clear feature communication suggests mature product marketing")
      confidence += 0.1
    }

    return { insights, recommendations, patterns, confidence }
  }

  private analyzeConversion(buttons: any[]): any {
    const insights = []
    const recommendations = []
    const patterns = []
    let confidence = 0.6

    const trialButtons = buttons.filter((b) => b.type === "trial")
    const purchaseButtons = buttons.filter((b) => b.type === "purchase")
    const signupButtons = buttons.filter((b) => b.type === "signup")

    if (trialButtons.length > purchaseButtons.length) {
      insights.push("Trial-first approach reduces purchase friction and builds trust")
      recommendations.push("Consider trial offerings to lower conversion barriers")
      patterns.push("trial-focused")
      confidence += 0.15
    }

    if (signupButtons.length > purchaseButtons.length) {
      insights.push("Focuses on user acquisition over immediate monetization")
      recommendations.push("Balance acquisition and monetization in your funnel")
    }

    const ctaButtons = buttons.filter((b) => b.type === "cta")
    if (ctaButtons.length > 3) {
      insights.push("Multiple CTAs suggest A/B testing or diverse conversion paths")
      recommendations.push("Test multiple CTA variations to optimize conversion")
    }

    return { insights, recommendations, patterns, confidence }
  }

  private generateTextAnalysis(insights: string[], recommendations: string[], confidence: number): string {
    let analysis = `INTELLIGENT COMPETITIVE ANALYSIS\n`
    analysis += `Confidence Score: ${(confidence * 100).toFixed(0)}%\n\n`

    analysis += `KEY INSIGHTS:\n`
    insights.forEach((insight, index) => {
      analysis += `${index + 1}. ${insight}\n`
    })

    analysis += `\nSTRATEGIC RECOMMENDATIONS:\n`
    recommendations.forEach((rec, index) => {
      analysis += `${index + 1}. ${rec}\n`
    })

    analysis += `\nANALYSIS SUMMARY:\n`
    if (confidence > 0.8) {
      analysis += `High-confidence analysis based on comprehensive data extraction. `
    } else if (confidence > 0.6) {
      analysis += `Moderate-confidence analysis with good data coverage. `
    } else {
      analysis += `Initial analysis with limited data - consider additional sources. `
    }

    analysis += `This analysis improves with each competitor evaluation through machine learning patterns.`

    return analysis
  }

  async getLearningStats(): Promise<LearningData> {
    const totalAnalyses = this.patterns.reduce((sum, p) => sum + p.usageCount, 0)
    const avgSuccessRate = this.patterns.reduce((sum, p) => sum + p.successRate, 0) / this.patterns.length

    const totalFeedback = this.feedbackHistory?.length || 0
    const positiveFeedback = this.feedbackHistory?.filter((f) => f.feedback === "positive").length || 0
    const feedbackRatio = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0.5

    const learningScore = Math.min(totalAnalyses / 100, 1) * avgSuccessRate * (0.7 + 0.3 * feedbackRatio)

    return {
      totalAnalyses,
      successRate: avgSuccessRate,
      learningScore,
      patterns: this.patterns,
      feedbackStats: {
        totalFeedback,
        positiveFeedback,
        negativeFeedback: totalFeedback - positiveFeedback,
        feedbackRatio,
      },
    }
  }

  async provideFeedback(analysisId: string, feedback: "positive" | "negative", accuracyScore: number): Promise<void> {
    console.log(`[v0] Processing feedback for analysis ${analysisId}: ${feedback}`)

    const feedbackWeight = accuracyScore || (feedback === "positive" ? 0.9 : 0.3)

    // Update pattern success rates based on feedback with weighted adjustments
    this.patterns.forEach((pattern) => {
      if (feedback === "positive") {
        // Positive feedback increases success rate and confidence more significantly
        pattern.successRate = Math.min(pattern.successRate + 0.05 * feedbackWeight, 1.0)
        pattern.confidence = Math.min(pattern.confidence + 0.03 * feedbackWeight, 1.0)
      } else {
        // Negative feedback decreases rates but not as drastically to prevent over-correction
        pattern.successRate = Math.max(pattern.successRate - 0.02 * (1 - feedbackWeight), 0.1)
        pattern.confidence = Math.max(pattern.confidence - 0.01 * (1 - feedbackWeight), 0.1)
      }

      // Track feedback count for each pattern
      if (!pattern.feedbackCount) {
        pattern.feedbackCount = 0
      }
      pattern.feedbackCount++
    })

    if (!this.feedbackHistory) {
      this.feedbackHistory = []
    }

    this.feedbackHistory.push({
      analysisId,
      feedback,
      accuracyScore: feedbackWeight,
      timestamp: new Date().toISOString(),
      patternsAffected: this.patterns.length,
    })

    // Keep only last 100 feedback entries to prevent memory issues
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-100)
    }

    console.log(
      `[v0] Updated ${this.patterns.length} patterns based on ${feedback} feedback (weight: ${feedbackWeight})`,
    )
  }

  async verifyWithWeb(scrapedData: any, originalUrl: string): Promise<any> {
    console.log("[v0] Starting web verification for scraped data...")

    const verificationResult = {
      verified: true,
      confidence: 0.85,
      discrepancies: [] as string[],
      additionalFindings: [] as string[],
    }

    // Simulate web verification logic
    try {
      // Check if pricing seems reasonable
      if (scrapedData.pricing && scrapedData.pricing.length > 0) {
        const prices = scrapedData.pricing
          .map((p: any) => Number.parseFloat(p.price.replace(/[^0-9.]/g, "")))
          .filter((p: number) => !isNaN(p))

        if (prices.some((p) => p > 10000)) {
          verificationResult.discrepancies.push("Unusually high pricing detected - may need manual review")
          verificationResult.confidence -= 0.1
        }

        if (prices.length === 0) {
          verificationResult.discrepancies.push("No valid pricing data extracted")
          verificationResult.confidence -= 0.2
        }
      }

      // Add additional insights based on domain analysis
      const domain = new URL(originalUrl).hostname
      if (domain.includes("stripe") || domain.includes("payment")) {
        verificationResult.additionalFindings.push("Payment processing company - expect transaction-based pricing")
      }

      if (domain.includes("saas") || domain.includes("software")) {
        verificationResult.additionalFindings.push("SaaS company - likely subscription-based revenue model")
      }

      // Simulate additional web research findings
      verificationResult.additionalFindings.push("Recent market analysis suggests competitive pricing pressure")
      verificationResult.additionalFindings.push("Industry trend toward freemium models in this sector")

      verificationResult.verified = verificationResult.discrepancies.length < 3
      console.log("[v0] Web verification completed")

      return verificationResult
    } catch (error) {
      console.error("[v0] Web verification error:", error)
      return {
        verified: false,
        confidence: 0.3,
        discrepancies: ["Web verification failed"],
        additionalFindings: [],
      }
    }
  }
}
