import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MonitoringSources } from "@/components/dashboard/monitoring-sources"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CompetitorDetailPageProps {
  params: {
    id: string
  }
}

export default async function CompetitorDetailPage({ params }: CompetitorDetailPageProps) {
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

  // Fetch recent changes for this competitor
  const { data: recentChanges } = await supabase
    .from("feature_changes")
    .select("*")
    .eq("competitor_id", params.id)
    .eq("user_id", user.id)
    .order("detected_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
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
              <h1 className="text-3xl font-bold text-slate-900">{competitor.name}</h1>
              <p className="text-slate-600">{competitor.industry}</p>
            </div>
          </div>
          <p className="text-slate-600">{competitor.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MonitoringSources competitorId={competitor.id} competitorName={competitor.name} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentChanges && recentChanges.length > 0 ? (
                <div className="space-y-4">
                  {recentChanges.map((change) => (
                    <div key={change.id} className="border-l-2 border-slate-200 pl-4 pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="mb-2">
                          {change.change_type.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Badge>
                        {change.is_important && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Important
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">{change.title}</h4>
                      <p className="text-xs text-slate-600 mb-2">{change.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {new Date(change.detected_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          Confidence: {Math.round((change.confidence_score || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">
                    No changes detected yet. Add monitoring sources to start tracking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
