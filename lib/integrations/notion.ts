interface NotionMessage {
  title: string
  content: string
  timestamp: string
}

export async function sendNotionPage(accessToken: string, databaseId: string, message: NotionMessage) {
  try {
    const notionPayload = {
      parent: {
        database_id: databaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: message.title,
              },
            },
          ],
        },
        Status: {
          select: {
            name: "Test",
          },
        },
        Date: {
          date: {
            start: message.timestamp.split("T")[0],
          },
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: message.content,
                },
              },
            ],
          },
        },
      ],
    }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Notion API error: ${response.status} ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    return { success: true, pageId: result.id, message: "Page created in Notion" }
  } catch (error) {
    console.error("Notion integration error:", error)
    throw error
  }
}

export async function sendNotionSummary(accessToken: string, databaseId: string, summary: any) {
  try {
    const summaryContent = summary.summary_content
    const weekStart = new Date(summary.week_start_date).toLocaleDateString()
    const weekEnd = new Date(summary.week_end_date).toLocaleDateString()

    const notionPayload = {
      parent: {
        database_id: databaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Weekly Competitive Intelligence Summary (${weekStart} - ${weekEnd})`,
              },
            },
          ],
        },
        Status: {
          select: {
            name: "Published",
          },
        },
        Date: {
          date: {
            start: summary.week_start_date,
            end: summary.week_end_date,
          },
        },
        "Total Changes": {
          number: summaryContent.totalChanges,
        },
        "Important Changes": {
          number: summaryContent.importantChanges,
        },
      },
      children: [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: "Executive Overview",
                },
              },
            ],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: summaryContent.overview,
                },
              },
            ],
          },
        },
      ],
    }

    // Add key insights section
    if (summaryContent.keyInsights && summaryContent.keyInsights.length > 0) {
      notionPayload.children.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [
            {
              type: "text",
              text: {
                content: "🔍 Key Insights",
              },
            },
          ],
        },
      })

      summaryContent.keyInsights.forEach((insight: any) => {
        notionPayload.children.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `${insight.insight} (${insight.impact.toUpperCase()} impact)`,
                },
              },
            ],
          },
        })
      })
    }

    // Add recommendations section
    if (summaryContent.recommendations && summaryContent.recommendations.length > 0) {
      notionPayload.children.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [
            {
              type: "text",
              text: {
                content: "🎯 Recommendations",
              },
            },
          ],
        },
      })

      summaryContent.recommendations.forEach((rec: any) => {
        notionPayload.children.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: `${rec.action} (${rec.priority.toUpperCase()} priority)`,
                },
              },
            ],
          },
        })
      })
    }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Notion API error: ${response.status} ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    return { success: true, pageId: result.id, message: "Summary page created in Notion" }
  } catch (error) {
    console.error("Notion summary integration error:", error)
    throw error
  }
}
