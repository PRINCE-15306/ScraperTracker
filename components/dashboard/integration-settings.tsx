"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Integration {
  id: string
  integration_type: string
  is_enabled: boolean
  webhook_url?: string
  channel_id?: string
  access_token?: string
  settings: Record<string, any>
}

export function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)

  // Slack settings
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("")

  // Notion settings
  const [notionEnabled, setNotionEnabled] = useState(false)
  const [notionAccessToken, setNotionAccessToken] = useState("")
  const [notionDatabaseId, setNotionDatabaseId] = useState("")

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations")
      const data = await response.json()
      if (data.integrations) {
        setIntegrations(data.integrations)

        // Set form values
        const slack = data.integrations.find((i: Integration) => i.integration_type === "slack")
        if (slack) {
          setSlackEnabled(slack.is_enabled)
          setSlackWebhookUrl(slack.webhook_url || "")
        }

        const notion = data.integrations.find((i: Integration) => i.integration_type === "notion")
        if (notion) {
          setNotionEnabled(notion.is_enabled)
          setNotionAccessToken(notion.access_token || "")
          setNotionDatabaseId(notion.settings?.databaseId || "")
        }
      }
    } catch (error) {
      console.error("Error fetching integrations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSlackIntegration = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: "slack",
          isEnabled: slackEnabled,
          webhookUrl: slackWebhookUrl,
        }),
      })

      if (response.ok) {
        fetchIntegrations()
      }
    } catch (error) {
      console.error("Error saving Slack integration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveNotionIntegration = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: "notion",
          isEnabled: notionEnabled,
          accessToken: notionAccessToken,
          settings: {
            databaseId: notionDatabaseId,
          },
        }),
      })

      if (response.ok) {
        fetchIntegrations()
      }
    } catch (error) {
      console.error("Error saving Notion integration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const testIntegration = async (type: string) => {
    setIsTesting(type)
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationType: type }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`${type} integration test successful!`)
      } else {
        alert(`${type} integration test failed: ${data.error}`)
      }
    } catch (error) {
      alert(`${type} integration test failed: ${error}`)
    } finally {
      setIsTesting(null)
    }
  }

  if (isLoading) {
    return <div>Loading integration settings...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="slack" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="slack">Slack</TabsTrigger>
          <TabsTrigger value="notion">Notion</TabsTrigger>
        </TabsList>

        <TabsContent value="slack">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Slack Integration</span>
                    {slackEnabled && <Badge className="bg-green-100 text-green-700">Connected</Badge>}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">Get weekly competitor updates in your Slack channel</p>
                </div>
                <Switch checked={slackEnabled} onCheckedChange={setSlackEnabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                <Input
                  id="slackWebhook"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  disabled={!slackEnabled}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={saveSlackIntegration} disabled={isSaving || !slackEnabled}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testIntegration("slack")}
                  disabled={!slackEnabled || !slackWebhookUrl || isTesting === "slack"}
                >
                  {isTesting === "slack" ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Quick Setup Guide
                </h4>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Open Slack</p>
                      <p className="text-blue-600">Go to your workspace settings</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Add Webhook</p>
                      <p className="text-blue-600">Find "Incoming Webhooks" and create one for your channel</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Copy & Paste</p>
                      <p className="text-blue-600">Paste the webhook URL above and test the connection</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notion">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Notion Integration</span>
                    {notionEnabled && <Badge className="bg-green-100 text-green-700">Connected</Badge>}
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Create organized competitor reports in your Notion workspace
                  </p>
                </div>
                <Switch checked={notionEnabled} onCheckedChange={setNotionEnabled} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notionToken">Notion Access Token</Label>
                <Input
                  id="notionToken"
                  type="password"
                  placeholder="secret_..."
                  value={notionAccessToken}
                  onChange={(e) => setNotionAccessToken(e.target.value)}
                  disabled={!notionEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notionDatabase">Database ID</Label>
                <Input
                  id="notionDatabase"
                  placeholder="Database ID from your Notion page URL"
                  value={notionDatabaseId}
                  onChange={(e) => setNotionDatabaseId(e.target.value)}
                  disabled={!notionEnabled}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={saveNotionIntegration} disabled={isSaving || !notionEnabled}>
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testIntegration("notion")}
                  disabled={!notionEnabled || !notionAccessToken || !notionDatabaseId || isTesting === "notion"}
                >
                  {isTesting === "notion" ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Quick Setup Guide
                </h4>
                <div className="space-y-3 text-sm text-purple-800">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <div>
                      <p className="font-medium">Create Integration</p>
                      <p className="text-purple-600">Visit notion.so/my-integrations and create a new integration</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <div>
                      <p className="font-medium">Get Token</p>
                      <p className="text-purple-600">Copy the access token and paste it above</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <div>
                      <p className="font-medium">Share Database</p>
                      <p className="text-purple-600">
                        Create a database, share it with your integration, and copy the database ID
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recommendation </CardTitle>
          <p className="text-sm text-slate-600">Try these popular websites to see competitor tracking in action</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Stripe", url: "https://stripe.com/pricing", category: "Payments" },
              { name: "OpenAI", url: "https://openai.com/api/pricing/", category: "AI" },
              { name: "Vercel", url: "https://vercel.com/pricing", category: "Hosting" },
              { name: "Notion", url: "https://www.notion.so/pricing", category: "Productivity" },
              { name: "Linear", url: "https://linear.app/pricing", category: "Project Management" },
              { name: "Figma", url: "https://www.figma.com/pricing/", category: "Design" },
            ].map((site) => (
              <div
                key={site.name}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">{site.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {site.category}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-3 truncate">{site.url}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs bg-transparent"
                  onClick={() => window.open(`/dashboard?add=${encodeURIComponent(site.url)}`, "_blank")}
                >
                  Add as Competitor
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
