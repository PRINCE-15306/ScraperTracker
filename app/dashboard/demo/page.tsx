import { DemoScraping } from "@/components/dashboard/demo-scraping"

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Live Scraping Demo</h1>
        <p className="text-slate-600">
          Watch the AI monitoring system scrape competitor websites and detect changes in real-time.
        </p>
      </div>
      <DemoScraping />
    </div>
  )
}
