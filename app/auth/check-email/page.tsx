import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Check your email</CardTitle>
            <CardDescription className="text-slate-600">
              We've sent you a confirmation link to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 mb-6">
              Click the link in your email to verify your account and start tracking competitors.
            </p>
            <Link href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
