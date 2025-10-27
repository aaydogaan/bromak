"use client"
import { useEffect, useMemo, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { StatCard } from "@/components/stat-card"
import { RevenueChart } from "@/components/revenue-chart"
import { RecentActivity } from "@/components/recent-activity"
import { Banknote, Users, FolderKanban } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type ChartRow = { month: string; revenue: number }

export default function DashboardPage() {
  const [monthRevenue, setMonthRevenue] = useState<number | null>(null)
  const [monthTrendText, setMonthTrendText] = useState<string | undefined>(undefined)
  const [monthTrendUp, setMonthTrendUp] = useState<boolean | undefined>(undefined)
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null)
  const [ongoingProjects, setOngoingProjects] = useState<number | null>(null)
  const [chartData, setChartData] = useState<ChartRow[] | null>(null)
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState<number | null>(null)
  const [newCustomersTrendText, setNewCustomersTrendText] = useState<string | undefined>(undefined)
  const [newCustomersTrendUp, setNewCustomersTrendUp] = useState<boolean | undefined>(undefined)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const start12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

        // Customers count
        const customersPromise = supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })

        // New customers this month and last month (for metric and trend)
        const customersThisMonthPromise = supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .gte('join_date', startOfMonth.toISOString())
          .lt('join_date', startOfNextMonth.toISOString())

        const customersLastMonthPromise = supabase
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .gte('join_date', startOfLastMonth.toISOString())
          .lt('join_date', startOfMonth.toISOString())

        // Ongoing projects count
        const projectsPromise = supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'in_progress')

        // Projects in last 12 months (for chart)
        const projectsForChartPromise = supabase
          .from('projects')
          .select('budget, start_date, status')
          .gte('start_date', start12MonthsAgo.toISOString())
          .order('start_date', { ascending: true })

        // Projects started this month (budget sum for current month revenue)
        const projectsThisMonthPromise = supabase
          .from('projects')
          .select('budget, start_date')
          .gte('start_date', startOfMonth.toISOString())
          .lt('start_date', startOfNextMonth.toISOString())

        // Projects started last month (for trend)
        const projectsLastMonthPromise = supabase
          .from('projects')
          .select('budget, start_date')
          .gte('start_date', startOfLastMonth.toISOString())
          .lt('start_date', startOfMonth.toISOString())

        const [
          { count: custCount },
          { count: projCount },
          { data: projectsForChart, error: pcErr },
          { data: projectsThisMonth, error: pErr },
          { data: projectsLastMonth, error: plErr },
          { count: newCustThis },
          { count: newCustLast }
        ] = await Promise.all([
          customersPromise,
          projectsPromise,
          projectsForChartPromise,
          projectsThisMonthPromise,
          projectsLastMonthPromise,
          customersThisMonthPromise,
          customersLastMonthPromise,
        ])
        if (pcErr) throw pcErr
        if (pErr) throw pErr
        if (plErr) throw plErr

        setTotalCustomers(typeof custCount === 'number' ? custCount : 0)
        setOngoingProjects(typeof projCount === 'number' ? projCount : 0)
        // New customers metric and trend
        const ncThis = typeof newCustThis === 'number' ? newCustThis : 0
        const ncLast = typeof newCustLast === 'number' ? newCustLast : 0
        setNewCustomersThisMonth(ncThis)
        if (ncLast === 0 && ncThis === 0) {
          setNewCustomersTrendText(undefined)
          setNewCustomersTrendUp(undefined)
        } else if (ncLast === 0 && ncThis > 0) {
          setNewCustomersTrendText('+100% geçen aya göre')
          setNewCustomersTrendUp(true)
        } else {
          const diff = ncThis - ncLast
          const pct = (diff / ncLast) * 100
          const sign = pct > 0 ? '+' : ''
          const text = `${sign}${pct.toFixed(1)}% geçen aya göre`
          setNewCustomersTrendText(text)
          setNewCustomersTrendUp(pct >= 0)
        }

        // Build 12 months buckets
        const months: { key: string; label: string; y: number; m: number }[] = []
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const label = d.toLocaleString('tr-TR', { month: 'short' })
          months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), y: d.getFullYear(), m: d.getMonth() })
        }

        const sums = new Map<string, number>()
        for (const pr of (projectsForChart || []) as Array<{ budget: string | number | null; start_date: string | null; status?: string }>) {
          if (pr.status === 'cancelled') continue
          const dateStr = pr.start_date
          if (!dateStr) continue
          const d = new Date(dateStr)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          // parse budget (supports "12.500", "12,500", "12500 TL")
          const raw = String(pr.budget ?? '').trim()
          if (!raw) continue
          const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
          const amt = parseFloat(normalized)
          if (!Number.isFinite(amt)) continue
          if (!sums.has(key)) sums.set(key, 0)
          sums.set(key, (sums.get(key) || 0) + amt)
        }

        const series: ChartRow[] = months.map((m) => ({ month: m.label, revenue: sums.get(m.key) || 0 }))
        setChartData(series)

        // Current month revenue from projects budgets
        const monthSum = (projectsThisMonth || []).reduce((acc: number, pr: any) => {
          // budget metnini sayıya çevir (örn. "12.500" veya "12500 TL")
          const raw = String(pr.budget ?? '').trim()
          if (!raw) return acc
          const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
          const val = parseFloat(normalized)
          if (!Number.isFinite(val)) return acc
          return acc + val
        }, 0)
        setMonthRevenue(monthSum)

        // Last month revenue and trend
        const lastMonthSum = (projectsLastMonth || []).reduce((acc: number, pr: any) => {
          const raw = String(pr.budget ?? '').trim()
          if (!raw) return acc
          const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
          const val = parseFloat(normalized)
          if (!Number.isFinite(val)) return acc
          return acc + val
        }, 0)

        if (lastMonthSum === 0 && monthSum === 0) {
          setMonthTrendText(undefined)
          setMonthTrendUp(undefined)
        } else if (lastMonthSum === 0 && monthSum > 0) {
          setMonthTrendText('+100% geçen aya göre')
          setMonthTrendUp(true)
        } else {
          const diff = monthSum - lastMonthSum
          const pct = (diff / lastMonthSum) * 100
          const sign = pct > 0 ? '+' : ''
          const text = `${sign}${pct.toFixed(1)}% geçen aya göre`
          setMonthTrendText(text)
          setMonthTrendUp(pct >= 0)
        }
      } catch (e) {
        console.error('Dashboard data error:', e)
      }
    }
    fetchAll()
  }, [supabase])

  const formatTL = (n: number | null) => {
    if (n == null) return '—'
    return `₺${n.toLocaleString('tr-TR')}`
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ana Sayfa</h1>
            <p className="mt-2 text-muted-foreground">Proje ve gelir yönetiminize genel bakış</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Bu Ay Kazanç"
              value={formatTL(monthRevenue)}
              icon={Banknote}
              trend={monthTrendText}
              trendUp={monthTrendUp}
            />
            <StatCard title="Toplam Müşteri" value={totalCustomers != null ? String(totalCustomers) : '—'} icon={Users} />
            <StatCard title="Yeni Müşteri (Bu Ay)" value={newCustomersThisMonth != null ? String(newCustomersThisMonth) : '—'} icon={Users} trend={newCustomersTrendText} trendUp={newCustomersTrendUp} />
            <StatCard title="Devam Eden Projeler" value={ongoingProjects != null ? String(ongoingProjects) : '—'} icon={FolderKanban} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart data={chartData ?? undefined} totalAnnual={chartData ? chartData.reduce((s, r) => s + r.revenue, 0) : undefined} />
            </div>
            <div>
              <RecentActivity />
            </div>
          </div>

          {/* Motive Edici Söz */}
          <div className="mt-12 text-center p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-border/50">
            <blockquote className="text-lg italic text-foreground/90">
              "Başarı, küçük çabaların tekrarından başka bir şey değildir."
            </blockquote>
            <p className="mt-2 text-sm text-muted-foreground">- Robert Collier</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Her gün küçük adımlarla büyük hedeflere ulaşabilirsiniz. Bugün atacağınız her adım, yarının başarısının temelini oluşturur.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
