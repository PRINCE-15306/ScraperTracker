export async function scrapeWebsite(url: string): Promise<string> {
  try {
    console.log(`[v0] Scraping website: ${url}`)

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    // Extract meaningful content from HTML
    const cleanContent = extractContentFromHtml(html)

    console.log(`[v0] Successfully scraped ${url}, content length: ${cleanContent.length}`)
    return cleanContent
  } catch (error) {
    console.error(`[v0] Error scraping ${url}:`, error)
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function extractContentFromHtml(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")

  // Remove HTML tags but keep the text content
  content = content.replace(/<[^>]*>/g, " ")

  // Clean up whitespace
  content = content.replace(/\s+/g, " ").trim()

  // Focus on meaningful content - remove common noise
  const lines = content.split("\n")
  const meaningfulLines = lines.filter((line) => {
    const trimmed = line.trim()
    return (
      trimmed.length > 10 &&
      !trimmed.match(/^(cookie|privacy|terms|©|copyright)/i) &&
      !trimmed.match(/^(skip to|navigation|menu|footer)/i)
    )
  })

  return meaningfulLines.join("\n").substring(0, 10000) // Limit to 10k chars
}
