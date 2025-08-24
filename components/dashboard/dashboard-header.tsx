"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const initials =
    user.user_metadata?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U"

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">CompetitorTrack</h1>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link
                href="/dashboard/summaries"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                Weekly Summaries
              </Link>
              <Link
                href="/dashboard/reports"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                Reports
              </Link>
              <Link
                href="/dashboard/production-scraper"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                Competitor Intelligence
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="font-medium">{user.user_metadata?.full_name || "User"}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
