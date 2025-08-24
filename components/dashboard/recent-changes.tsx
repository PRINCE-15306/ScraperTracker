import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecentChangesProps {
  changes: any[]
}

export function RecentChanges({ changes }: RecentChangesProps) {
  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No changes detected yet. Add competitors to start monitoring.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "feature_added":
        return "bg-green-100 text-green-700"
      case "feature_removed":
        return "bg-red-100 text-red-700"
      case "pricing_change":
        return "bg-yellow-100 text-yellow-700"
      case "ui_change":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const formatChangeType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {changes.map((change) => (
          <div key={change.id} className="border-l-2 border-slate-200 pl-4 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-600">
                    {change.competitors?.name?.charAt(0) || "C"}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-900">{change.competitors?.name || "Unknown"}</span>
              </div>
              <Badge variant="secondary" className={getChangeTypeColor(change.change_type)}>
                {formatChangeType(change.change_type)}
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-slate-900 mb-1">{change.title}</h4>
            <p className="text-xs text-slate-600 mb-2 line-clamp-2">{change.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{new Date(change.detected_at).toLocaleDateString()}</span>
              {change.is_important && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  Important
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
