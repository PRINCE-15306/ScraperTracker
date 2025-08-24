import { EnhancedScrapingDemo } from "@/components/dashboard/enhanced-scraping-demo"

export default function EnhancedDemoPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Enhanced Scraping Demo</h1>
        <p className="text-muted-foreground">
          Advanced competitor analysis with pricing, coupons, and discount detection
        </p>
      </div>
      <EnhancedScrapingDemo />
    </div>
  )
}
