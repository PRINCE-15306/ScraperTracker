"use client"

import { Component, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[v0] Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription>An unexpected error occurred. Please try refreshing the page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-muted-foreground">Error details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{this.state.error.stack}</pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
