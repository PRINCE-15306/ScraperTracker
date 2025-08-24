"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Target, Lightbulb, CheckCircle, AlertTriangle } from "lucide-react"

interface AnalysisData {
  insights: string[]
  recommendations: string[]
  confidence: number
  detectedPatterns: string[]
  analysis: string
}

interface VerificationData {
  verified: boolean
  confidence: number
  discrepancies: string[]
  additionalFindings: string[]
}

interface LearningStats {
  totalAnalyses: number
  successRate: number
  learningScore: number
}

interface IntelligentAnalysisDashboardProps {
  analysisData: AnalysisData | null
  verificationData: VerificationData | null
  learningStats: LearningStats | null
  onFeedback: (type: "positive" | "negative") => void
}

export function IntelligentAnalysisDashboard({
  analysisData,
  verificationData,
  learningStats,
  onFeedback,
}: IntelligentAnalysisDashboardProps) {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null)

  if (!analysisData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Run intelligent analysis to see AI-powered insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{(analysisData.confidence * 100).toFixed(0)}%</span>
                <Badge variant={analysisData.confidence > 0.8 ? "default" : "secondary"}>
                  {analysisData.confidence > 0.8 ? "High" : analysisData.confidence > 0.6 ? "Medium" : "Low"}
                </Badge>
              </div>
              <Progress value={analysisData.confidence * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Insights Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisData.insights.length}</div>
            <p className="text-xs text-muted-foreground">Strategic insights identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisData.recommendations.length}</div>
            <p className="text-xs text-muted-foreground">Actionable recommendations</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Statistics */}
      {learningStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Learning Progress
            </CardTitle>
            <CardDescription>AI system improvement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{learningStats.totalAnalyses}</div>
                <div className="text-sm text-muted-foreground">Total Analyses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{(learningStats.successRate * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(learningStats.learningScore * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Learning Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      {verificationData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationData.verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Web Verification
            </CardTitle>
            <CardDescription>Data accuracy verification through web research</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Verification Status:</span>
                <Badge variant={verificationData.verified ? "default" : "destructive"}>
                  {verificationData.verified ? "Verified" : "Needs Review"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Confidence:</span>
                <span className="font-medium">{(verificationData.confidence * 100).toFixed(0)}%</span>
              </div>

              {verificationData.discrepancies.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Discrepancies Found:</h4>
                  <ul className="space-y-1">
                    {verificationData.discrepancies.map((discrepancy, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500" />
                        {discrepancy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {verificationData.additionalFindings.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Additional Insights:</h4>
                  <ul className="space-y-1">
                    {verificationData.additionalFindings.map((finding, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 mt-0.5 text-blue-500" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Insights</CardTitle>
          <CardDescription>AI-identified competitive intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisData.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedInsight === index ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedInsight(selectedInsight === index ? null : index)}
              >
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm flex-1">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
          <CardDescription>Actionable insights for competitive advantage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisData.recommendations.map((recommendation, index) => (
              <div key={index} className="p-3 rounded-lg border">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-0.5">
                    {index + 1}
                  </Badge>
                  <p className="text-sm flex-1">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
