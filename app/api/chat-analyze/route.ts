import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, scrapedData, previousAnalysis } = await request.json()

    if (!message || !scrapedData) {
      return NextResponse.json({ success: false, error: "Missing required data" })
    }

    console.log("[v0] Processing chat analysis request:", message)

    // Intelligent response generation based on the message and scraped data
    let response = ""
    let chartData = null
    let tableData = null

    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("pricing") || lowerMessage.includes("price")) {
      const pricingCount = scrapedData.pricing?.length || 0
      if (pricingCount > 0) {
        const prices = scrapedData.pricing
          .map((p: any) => Number.parseFloat(p.price.replace(/[^0-9.]/g, "")))
          .filter((p: number) => !isNaN(p))
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

        response = `I found ${pricingCount} pricing tiers on this competitor's site. The average price point is $${avgPrice.toFixed(2)}. `

        if (scrapedData.pricing.some((p: any) => p.category === "freemium")) {
          response +=
            "They use a freemium model, which suggests they prioritize user acquisition over immediate revenue. "
        }

        if (scrapedData.pricing.some((p: any) => p.category === "enterprise")) {
          response += "They have enterprise pricing, indicating they target larger organizations. "
        }

        response += "Would you like me to analyze their pricing strategy in more detail?"

        chartData = {
          type: "bar",
          title: "Competitor Pricing Analysis",
          data: scrapedData.pricing.map((p: any) => ({
            plan: p.plan,
            price: Number.parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0,
            confidence: Math.round(p.confidence * 100),
            category: p.category,
          })),
        }

        tableData = {
          title: "Pricing Plans Comparison",
          headers: ["Plan", "Price", "Billing", "Category", "Confidence", "Features"],
          rows: scrapedData.pricing.map((p: any) => [
            p.plan,
            p.price,
            p.billing,
            p.category,
            `${Math.round(p.confidence * 100)}%`,
            p.features.slice(0, 3).join(", ") + (p.features.length > 3 ? "..." : ""),
          ]),
        }
      } else {
        response =
          "I didn't find any clear pricing information on their site. This could indicate they use a contact-based sales model or hide pricing behind registration."
      }
    } else if (lowerMessage.includes("feature") || lowerMessage.includes("capability")) {
      const featureCount = scrapedData.features?.length || 0
      if (featureCount > 0) {
        const categories = scrapedData.features.reduce((acc: any, f: any) => {
          acc[f.category] = (acc[f.category] || 0) + 1
          return acc
        }, {})

        response = `I identified ${featureCount} features across their platform. The breakdown is: ${Object.entries(
          categories,
        )
          .map(([cat, count]) => `${cat}: ${count}`)
          .join(", ")}. `

        if (categories.premium > categories.core) {
          response += "They emphasize premium features, suggesting a value-based pricing strategy. "
        }

        response += "This gives us insight into their product positioning and target market."

        chartData = {
          type: "pie",
          title: "Feature Distribution by Category",
          data: Object.entries(categories).map(([category, count]) => ({
            name: category,
            value: count as number,
            color: getColorForCategory(category),
          })),
        }

        tableData = {
          title: "Feature Analysis",
          headers: ["Feature", "Category", "Confidence"],
          rows: scrapedData.features.map((f: any) => [f.text, f.category, `${Math.round(f.confidence * 100)}%`]),
        }
      } else {
        response =
          "I didn't extract specific feature information from their site. This might indicate they focus more on benefits than technical features in their marketing."
      }
    } else if (
      lowerMessage.includes("promotion") ||
      lowerMessage.includes("discount") ||
      lowerMessage.includes("coupon")
    ) {
      const promoCount = (scrapedData.coupons?.length || 0) + (scrapedData.discounts?.length || 0)
      if (promoCount > 0) {
        response = `I found ${promoCount} active promotions (${scrapedData.coupons?.length || 0} coupons, ${scrapedData.discounts?.length || 0} discounts). `

        if (promoCount > 3) {
          response +=
            "This high level of promotional activity suggests they're in an aggressive customer acquisition phase. "
        }

        response += "This indicates their current marketing strategy and competitive pressure in the market."

        chartData = {
          type: "bar",
          title: "Promotional Activity Analysis",
          data: [
            { name: "Coupons", value: scrapedData.coupons?.length || 0, color: "#10b981" },
            { name: "Discounts", value: scrapedData.discounts?.length || 0, color: "#f59e0b" },
          ],
        }

        const promoRows = [
          ...(scrapedData.coupons || []).map((c: any) => ["Coupon", c.code, c.discount, c.description]),
          ...(scrapedData.discounts || []).map((d: any) => ["Discount", d.text, d.percentage, d.type]),
        ]

        tableData = {
          title: "Active Promotions",
          headers: ["Type", "Code/Text", "Value", "Description"],
          rows: promoRows,
        }
      } else {
        response =
          "No active promotions detected. This could indicate premium positioning or confidence in their value proposition without needing discounts."
      }
    } else if (lowerMessage.includes("strategy") || lowerMessage.includes("competitive")) {
      response = "Based on my analysis, here's their competitive strategy:\n\n"

      if (previousAnalysis?.insights) {
        response += previousAnalysis.insights.slice(0, 3).join("\n") + "\n\n"
      }

      response += "Key strategic indicators:\n"

      if (scrapedData.pricing?.some((p: any) => p.category === "freemium")) {
        response += "• Freemium model suggests growth-focused strategy\n"
      }

      if ((scrapedData.coupons?.length || 0) + (scrapedData.discounts?.length || 0) > 2) {
        response += "• High promotional activity indicates competitive market pressure\n"
      }

      if (
        scrapedData.buttons?.filter((b: any) => b.type === "trial").length >
        scrapedData.buttons?.filter((b: any) => b.type === "purchase").length
      ) {
        response += "• Trial-focused CTAs reduce purchase friction\n"
      }

      response += "\nWould you like me to dive deeper into any specific aspect?"

      const strategyMetrics = [
        { name: "Pricing Tiers", value: scrapedData.pricing?.length || 0 },
        { name: "Promotions", value: (scrapedData.coupons?.length || 0) + (scrapedData.discounts?.length || 0) },
        { name: "Features", value: scrapedData.features?.length || 0 },
        { name: "CTAs", value: scrapedData.buttons?.length || 0 },
      ]

      chartData = {
        type: "radar",
        title: "Competitive Strategy Overview",
        data: strategyMetrics,
      }
    } else if (lowerMessage.includes("recommend") || lowerMessage.includes("suggestion")) {
      response = "Based on this competitive analysis, here are my strategic recommendations:\n\n"

      if (previousAnalysis?.recommendations) {
        response += previousAnalysis.recommendations.slice(0, 3).join("\n") + "\n\n"
      } else {
        response += "• Monitor their pricing changes monthly to track strategy shifts\n"
        response += "• Analyze their feature gaps for differentiation opportunities\n"
        response += "• Track their promotional patterns to anticipate market moves\n\n"
      }

      response += "These insights will help you stay ahead of their competitive moves."
    } else if (lowerMessage.includes("chart") || lowerMessage.includes("graph") || lowerMessage.includes("visualize")) {
      response = "I can create several visualizations from the scraped data:\n\n"

      if (scrapedData.pricing?.length > 0) {
        response += "📊 Pricing comparison chart\n"
        chartData = {
          type: "bar",
          title: "Pricing Plans Comparison",
          data: scrapedData.pricing.map((p: any) => ({
            plan: p.plan,
            price: Number.parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0,
            confidence: Math.round(p.confidence * 100),
          })),
        }
      }

      if (scrapedData.features?.length > 0) {
        const categories = scrapedData.features.reduce((acc: any, f: any) => {
          acc[f.category] = (acc[f.category] || 0) + 1
          return acc
        }, {})

        response += "🥧 Feature distribution pie chart\n"
        if (!chartData) {
          chartData = {
            type: "pie",
            title: "Feature Distribution",
            data: Object.entries(categories).map(([category, count]) => ({
              name: category,
              value: count as number,
              color: getColorForCategory(category),
            })),
          }
        }
      }

      response += "\nWhat specific aspect would you like me to visualize?"
    } else if (
      lowerMessage.includes("table") ||
      lowerMessage.includes("compare") ||
      lowerMessage.includes("breakdown")
    ) {
      response = "Here's a detailed breakdown of the competitor data:\n\n"

      if (scrapedData.pricing?.length > 0) {
        tableData = {
          title: "Comprehensive Pricing Analysis",
          headers: ["Plan", "Price", "Billing", "Category", "Confidence", "Key Features"],
          rows: scrapedData.pricing.map((p: any) => [
            p.plan,
            p.price,
            p.billing,
            p.category,
            `${Math.round(p.confidence * 100)}%`,
            p.features.slice(0, 2).join(", ") + (p.features.length > 2 ? "..." : ""),
          ]),
        }
        response += "📋 Created detailed pricing comparison table\n"
      }

      response += "\nThe table shows all key metrics for easy comparison."
    } else {
      response = `I can help you analyze various aspects of this competitor:\n\n• Pricing strategy and positioning\n• Feature analysis and gaps\n• Promotional tactics\n• Overall competitive strategy\n• Strategic recommendations\n\nWhat specific aspect would you like to explore? You can ask questions like "How does their pricing compare?" or "What's their promotional strategy?"\n\nI can also create charts and tables - just ask me to "visualize the pricing" or "create a feature comparison table"!`
    }

    return NextResponse.json({
      success: true,
      response,
      chartData,
      tableData,
    })
  } catch (error) {
    console.error("[v0] Chat analysis error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process chat request",
    })
  }
}

function getColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    core: "#3b82f6",
    premium: "#8b5cf6",
    enterprise: "#10b981",
    addon: "#f59e0b",
  }
  return colorMap[category] || "#6b7280"
}
