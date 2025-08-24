import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CompetitorGrid } from "@/components/dashboard/competitor-grid"
import { RecentChanges } from "@/components/dashboard/recent-changes"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const addCompetitorUrl = searchParams.add as string | undefined

  // Fetch user's competitors
  const { data: competitors } = await supabase
    .from("competitors")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch recent changes
  const { data: recentChanges } = await supabase
    .from("feature_changes")
    .select(`
      *,
      competitors (name, logo_url)
    `)
    .eq("user_id", user.id)
    .order("detected_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Competitor Intelligence Dashboard</h1>
          <p className="text-slate-600">
            Track feature updates, pricing changes, and product messaging from your competitors
          </p>
        </div>

        <DashboardStats competitors={competitors || []} recentChanges={recentChanges || []} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <CompetitorGrid competitors={competitors || []} addCompetitorUrl={addCompetitorUrl} />
          </div>
          <div>
            <RecentChanges changes={recentChanges || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
