"use client"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Money from "@/components/money"
import { RevenueChart } from "@/components/revenue-chart"
import { ProjectStatusChart } from "@/components/project-status-chart"
import { PaymentsTable } from "@/components/payments-table"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { TopClientsTable } from "@/components/top-clients-table"
import { PercentageCalculator } from "@/components/percentage-calculator"
import { Banknote, FolderKanban } from "lucide-react"
import { PageWrapper } from "@/components/page-wrapper"
import { createClient } from "@/lib/supabase/client"

type ChartRow = {
  month: string
  revenue: number
  projects?: Array<{ name: string; client: string; amount: number }>
}

function mapType(t: string): string {
  switch (t) {
    case 'web_site': return 'Web Sitesi'
    case 'sosyal_medya': return 'Sosyal Medya'
    case 'seo_hizmeti': return 'Seo Hizmeti'
    case 'video_cekimi': return 'Video Çekimi'
    case 'baski_isleri': return 'Baskı İşleri'
    case 'diger': return 'Diğer'
    default: return 'Diğer'
  }
}

export default function StatisticsPage() {
  const [annualTotal, setAnnualTotal] = useState<number>(0)
  const [monthlyAverage, setMonthlyAverage] = useState<number>(0)
  const [totalProjects, setTotalProjects] = useState<number>(0)
  const [chartData, setChartData] = useState<ChartRow[] | null>(null)
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[] | null>(null)
  const [topClients, setTopClients] = useState<{ name: string; projects: number; revenue: number }[] | null>(null)
  const [typeRevenue, setTypeRevenue] = useState<{ name: string; value: number; color: string }[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const start12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

      // Projects for chart and totals
      const { data: projects, error } = await supabase
        .from('projects')
        .select('name, client, budget, start_date, payment_date, payment_amount, created_at, status, project_type')
        .order('start_date', { ascending: true })
      if (error) {
        console.error('istatistikler data err', error)
        return
      }

      // Customers for Top Clients (by total_income)
      const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select('first_name, last_name, total_income')
      if (cErr) {
        console.error('istatistikler customers err', cErr)
      }

      const months: { key: string; label: string }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleString('tr-TR', { month: 'short' })
        months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) })
      }

      const sums = new Map<string, number>()
      const projectsByMonth = new Map<string, Array<{ name: string; client: string; amount: number }>>()
      const statusCounts = new Map<string, number>()
      const typeSums = new Map<string, number>()
      const byClient = new Map<string, { sum: number; count: number }>()

      for (const pr of (projects || []) as Array<{ name?: string; client?: string; budget: string | number | null; start_date: string | null; payment_date?: string | null; payment_amount?: string | number | null; created_at?: string | null; status?: string; project_type?: string }>) {
        // status counts
        const st = pr.status || 'unknown'
        statusCounts.set(st, (statusCounts.get(st) || 0) + 1)
        
        // Calculate project value
        const amountSource = pr.payment_amount || pr.budget
        const raw = (typeof amountSource === 'number' ? String(amountSource) : String(amountSource || '')).trim()
        let val = 0;
        if (raw) {
          const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
          val = parseFloat(normalized)
          if (!Number.isFinite(val)) {
            const digits = raw.replace(/\D/g, '')
            val = digits ? parseFloat(digits) : 0
          }
        }
        
        // project counts & revenue by client (for top clients)
        const clientName = (pr.client || 'Bilinmeyen Müşteri').trim()
        const agg = byClient.get(clientName) || { sum: 0, count: 0 }
        agg.count += 1
        // İptal edilen projeler müşterinin toplam gelirine girmesin:
        if (pr.status !== 'cancelled') {
           agg.sum += val
        }
        byClient.set(clientName, agg)

        // Skip cancelled projects from revenue calculations (same as homepage)
        if (pr.status === 'cancelled') continue
        
        // chart sums - use payment_date if available, otherwise fall back to start_date
        const dateStr = pr.payment_date || pr.start_date || pr.created_at || null
        if (!dateStr) continue
        const d = new Date(dateStr)
        if (d < start12MonthsAgo) continue
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        sums.set(key, (sums.get(key) || 0) + val)

        // Add to projects list for this month
        if (!projectsByMonth.has(key)) projectsByMonth.set(key, [])
        projectsByMonth.get(key)!.push({
          name: pr.name || 'İsimsiz Proje',
          client: clientName,
          amount: val
        })

        // revenue by type
        const t = pr.project_type || 'diger'
        typeSums.set(t, (typeSums.get(t) || 0) + val)
      }

      // If no type sums after filtering, fallback to all projects (no date filter)
      if (typeSums.size === 0 && (projects || []).length > 0) {
        for (const pr of (projects || []) as Array<{ budget: string | number | null; project_type?: string }>) {
          const raw = (typeof pr.budget === 'number' ? String(pr.budget) : String(pr.budget || '')).trim()
          if (!raw) continue
          const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
          let val = parseFloat(normalized)
          if (!Number.isFinite(val)) {
            const digits = raw.replace(/\D/g, '')
            val = digits ? parseFloat(digits) : NaN
          }
          if (!Number.isFinite(val)) continue
          const t = pr.project_type || 'diger'
          typeSums.set(t, (typeSums.get(t) || 0) + val)
        }
      }

      const series: ChartRow[] = months.map((m) => ({
        month: m.label,
        revenue: sums.get(m.key) || 0,
        projects: projectsByMonth.get(m.key) || []
      }))
      setChartData(series)
      const total = series.reduce((a, b) => a + b.revenue, 0)
      setAnnualTotal(total)
      setMonthlyAverage(Math.round(total / 12))
      setTotalProjects((projects || []).length)

      const palette: Record<string, string> = {
        in_progress: 'hsl(var(--primary))',
        planning: 'hsl(var(--secondary))',
        on_hold: 'hsl(var(--muted))',
        completed: 'hsl(var(--accent))',
        cancelled: 'hsl(var(--destructive))',
        unknown: 'hsl(var(--border))',
      }
      const typePalette: Record<string, string> = {
        web_site: '#6366f1', // indigo
        sosyal_medya: '#22c55e', // yeşil
        seo_hizmeti: '#f59e0b', // amber
        video_cekimi: '#f97316', // turuncu
        baski_isleri: '#ec4899', // pembe
        diger: '#64748b', // slate
      }
      const rows = Array.from(statusCounts.entries()).map(([name, value]) => ({ name: mapStatus(name), value, color: palette[name] || 'hsl(var(--border))' }))
      setStatusData(rows)

      const typeRows = Array.from(typeSums.entries()).map(([k, v]) => ({ name: mapType(k), value: Math.round(v), color: typePalette[k] || 'hsl(var(--border))' }))
      setTypeRevenue(typeRows)

      // Top 5 clients dynamically from projects
      const top = Array.from(byClient.entries())
        .map(([name, data]) => ({
          name,
          projects: data.count,
          revenue: Math.round(data.sum),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        
      setTopClients(top)
      setLoading(false)
    }
    load()
  }, [supabase])

  const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">İstatistikler</h1>
            <p className="mt-2 text-muted-foreground">Detaylı gelir ve proje analizleri</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yıllık Gelir</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight"><Money value={tl(annualTotal)} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border bg-primary/5 p-3">
                    <div className="text-xs text-muted-foreground">%40 pay</div>
                    <div className="text-lg font-semibold text-foreground"><Money value={tl(Math.round(annualTotal * 0.4))} /></div>
                  </div>
                  <div className="rounded-lg border bg-secondary/5 p-3">
                    <div className="text-xs text-muted-foreground">%60 pay</div>
                    <div className="text-lg font-semibold text-foreground"><Money value={tl(Math.round(annualTotal * 0.6))} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aylık Ortalama</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><Money value={tl(monthlyAverage)} /></div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <div className="text-xs text-muted-foreground">Son 12 ay</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart data={chartData ?? undefined} totalAnnual={annualTotal} disableFallback />
            <ProjectStatusChart data={statusData ?? undefined} disableFallback />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <PercentageCalculator />
            <Card className="glass-effect lg:col-span-2">
              <CardHeader>
                <CardTitle>Türlere Göre Gelir (Son 12 Ay)</CardTitle>
              </CardHeader>
              <CardContent>
                {typeRevenue && typeRevenue.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={typeRevenue} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {typeRevenue.map((entry, idx) => (
                            <Cell key={`tp-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Gelir']}
                          contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                          itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle"
                          formatter={(value, entry: any) => {
                            const item = typeRevenue.find(t => t.name === value)
                            const total = typeRevenue.reduce((acc, curr) => acc + curr.value, 0)
                            const percent = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                            return <span className="text-foreground font-medium ml-1">{value} <span className="text-muted-foreground ml-1">%{percent}</span></span>
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    Veri bulunamadı (son 12 ay). Yeni projeler ekleyin veya tarih aralığını genişletelim.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <PaymentsTable />

          <TopClientsTable data={topClients ?? undefined} />
        </div>
      </div>
    </PageWrapper>
  )
}

function mapStatus(s: string): string {
  switch (s) {
    case 'planning': return 'Planlama'
    case 'in_progress': return 'Devam Ediyor'
    case 'on_hold': return 'Beklemede'
    case 'completed': return 'Tamamlandı'
    case 'cancelled': return 'İptal'
    default: return 'Bilinmiyor'
  }
}
