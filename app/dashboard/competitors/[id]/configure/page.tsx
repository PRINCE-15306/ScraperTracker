import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MonitoringSources } from "@/components/dashboard/monitoring-sources"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CompetitorConfigurePageProps {
  params: {
    id: string
  }
}

export default async function CompetitorConfigurePage({ params }: CompetitorConfigurePageProps) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch competitor details
  const { data: competitor } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!competitor) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/dashboard/competitors/${params.id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {competitor.name}
            </Button>
          </Link>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              {competitor.logo_url ? (
                <img
                  src={competitor.logo_url || "/placeholder.svg"}
                  alt={competitor.name}
                  className="w-10 h-10 rounded"
                />
              ) : (
                <span className="text-lg font-semibold text-slate-600">{competitor.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Configure {competitor.name}</h1>
              <p className="text-slate-600">Set up monitoring sources and tracking preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MonitoringSources competitorId={competitor.id} competitorName={competitor.name} />

          <Card>
            <CardHeader>
              <CardTitle>Tracking Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600">
                <p className="mb-4">Configure what changes you want to track for {competitor.name}:</p>
                <ul className="space-y-2">
                  <li>• Website content and layout changes</li>
                  <li>• Pricing and product updates</li>
                  <li>• New feature announcements</li>
                  <li>• Blog posts and news</li>
                  <li>• Social media activity</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
