"use client"
import { useEffect, useMemo, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { StatCard } from "@/components/stat-card"
import { RevenueChart } from "@/components/revenue-chart"
import { RecentActivity } from "@/components/recent-activity"

import { Banknote, Users, FolderKanban } from "lucide-react"
import { createClient } from "@/lib/supabase/client"


import { AtusWidget } from "@/components/atus-widget"
import { TahsilatHesaplamaWidget } from "@/components/tahsilat-hesaplama-widget"

type ChartRow = {
  month: string
  revenue: number
  projects?: Array<{ name: string; client: string; amount: number }>
}

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

        // Robust Turkish/standard money parser
        const parseTurkishNumber = (value: string): number => {
          if (!value) return 0
          const cleaned = value.replace(/[^0-9.,]/g, '')
          
          if (cleaned.includes('.') && cleaned.includes(',')) {
            const normalized = cleaned.replace(/\./g, '').replace(',', '.')
            return parseFloat(normalized) || 0
          }
          
          if (cleaned.includes(',')) {
            const normalized = cleaned.replace(',', '.')
            return parseFloat(normalized) || 0
          }
          
          if (cleaned.includes('.')) {
            const parts = cleaned.split('.')
            const lastPart = parts[parts.length - 1]
            if (lastPart.length === 3) {
              const normalized = cleaned.replace(/\./g, '')
              return parseFloat(normalized) || 0
            } else {
              return parseFloat(cleaned) || 0
            }
          }
          
          return parseFloat(cleaned) || 0
        }

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
          .select('name, client, budget, start_date, payment_date, payment_amount, status')
          .gte('start_date', start12MonthsAgo.toISOString())
          .order('start_date', { ascending: true })

        // Projects with payment this month (for current month revenue)
        const projectsThisMonthPromise = supabase
          .from('projects')
          .select('budget, start_date, payment_date, payment_amount')
          .or(`payment_date.gte.${startOfMonth.toISOString()},and(payment_date.is.null,start_date.gte.${startOfMonth.toISOString()})`)
          .or(`payment_date.lt.${startOfNextMonth.toISOString()},and(payment_date.is.null,start_date.lt.${startOfNextMonth.toISOString()})`)

        // Projects with payment last month (for trend)
        const projectsLastMonthPromise = supabase
          .from('projects')
          .select('budget, start_date, payment_date, payment_amount')
          .or(`payment_date.gte.${startOfLastMonth.toISOString()},and(payment_date.is.null,start_date.gte.${startOfLastMonth.toISOString()})`)
          .or(`payment_date.lt.${startOfMonth.toISOString()},and(payment_date.is.null,start_date.lt.${startOfMonth.toISOString()})`)

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
        const projectsByMonth = new Map<string, Array<{ name: string; client: string; amount: number }>>()

        for (const pr of (projectsForChart || []) as Array<{ name?: string; client?: string; budget: string | number | null; start_date: string | null; payment_date?: string | null; payment_amount?: string | number | null; status?: string }>) {
          if (pr.status === 'cancelled') continue
          // Use payment_date if available, otherwise fall back to start_date
          const dateStr = pr.payment_date || pr.start_date
          if (!dateStr) continue
          const d = new Date(dateStr)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          // Use payment_amount if available, otherwise fall back to budget
          const amountSource = pr.payment_amount || pr.budget
          const raw = String(amountSource ?? '').trim()
          if (!raw) continue
          const amt = parseTurkishNumber(raw)
          if (!Number.isFinite(amt)) continue

          // Add to sums
          if (!sums.has(key)) sums.set(key, 0)
          sums.set(key, (sums.get(key) || 0) + amt)

          // Add to projects list for this month
          if (!projectsByMonth.has(key)) projectsByMonth.set(key, [])
          projectsByMonth.get(key)!.push({
            name: pr.name || 'İsimsiz Proje',
            client: pr.client || 'Bilinmeyen Müşteri',
            amount: amt
          })
        }

        const series: ChartRow[] = months.map((m) => ({
          month: m.label,
          revenue: sums.get(m.key) || 0,
          projects: projectsByMonth.get(m.key) || []
        }))
        setChartData(series)

        // Current month revenue from projects
        const monthSum = (projectsThisMonth || []).reduce((acc: number, pr: any) => {
          // Use payment_amount if available, otherwise fall back to budget
          const amountSource = pr.payment_amount || pr.budget
          const raw = String(amountSource ?? '').trim()
          if (!raw) return acc
          const val = parseTurkishNumber(raw)
          if (!Number.isFinite(val)) return acc
          return acc + val
        }, 0)
        setMonthRevenue(monthSum)

        // Last month revenue and trend
        const lastMonthSum = (projectsLastMonth || []).reduce((acc: number, pr: any) => {
          const amountSource = pr.payment_amount || pr.budget
          const raw = String(amountSource ?? '').trim()
          if (!raw) return acc
          const val = parseTurkishNumber(raw)
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

  const celebrate = () => {
    // Audio
    try {
      const audio = new Audio('/win-ses.mp3')
      audio.volume = 0.6
      // play might be blocked until user gesture; this is called from a click
      audio.play().catch(() => { })
    } catch (_) { }

    // Container overlay
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.inset = '0'
    container.style.pointerEvents = 'none'
    container.style.overflow = 'hidden'
    container.style.zIndex = '9999'
    document.body.appendChild(container)

    // Fireworks canvas (transparent over page)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    container.appendChild(canvas)

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e', '#eab308', '#f97316', '#a855f7']

    // Fireworks state
    type FWParticle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }
    type Rocket = { x: number; y: number; vx: number; vy: number; peak: number; color: string }
    const particles: FWParticle[] = []
    const rockets: Rocket[] = []
    const gravity = 0.07
    const friction = 0.99
    let rafId = 0
    let start = performance.now()

    const spawnRocket = () => {
      const x = Math.random() * canvas.width
      const y = canvas.height + 10
      const vx = (Math.random() - 0.5) * 1.2
      const vy = -(5 + Math.random() * 2)
      const peak = 120 + Math.random() * 220
      const color = colors[Math.floor(Math.random() * colors.length)]
      rockets.push({ x, y, vx, vy, peak, color })
    }

    const explode = (x: number, y: number, color: string) => {
      const count = 60 + Math.floor(Math.random() * 50)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
        const speed = 2 + Math.random() * 3.5
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 40 + Math.floor(Math.random() * 25),
          maxLife: 65,
          color,
          size: 2 + Math.random() * 2.5,
        })
      }
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.x += r.vx
        r.y += r.vy
        r.vy += gravity * 0.25
        // explode conditions: reached peak height or starts falling
        if (canvas.height - r.y > r.peak || r.vy >= 0) {
          explode(r.x, r.y, r.color)
          rockets.splice(i, 1)
        } else {
          // draw rocket glow
          ctx.beginPath()
          ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = r.color
          ctx.fill()
        }
      }

      // update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= friction
        p.vy = p.vy * friction + gravity
        p.life -= 1
        const alpha = Math.max(0, p.life / p.maxLife)
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0')
        // draw as rectangle spark
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(((p.maxLife - p.life) / p.maxLife) * Math.PI)
        ctx.globalAlpha = alpha
        ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 1.6)
        ctx.restore()
        if (p.life <= 0) particles.splice(i, 1)
      }

      const elapsed = performance.now() - start
      // spawn rockets for ~10s
      if (elapsed < 10000) {
        // 1-3 rockets per frame with low probability, average ~6-8/sec
        if (Math.random() < 0.18) spawnRocket()
        if (Math.random() < 0.06) spawnRocket()
      }

      if (elapsed > 12000 && particles.length === 0 && rockets.length === 0) {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', resize)
        // canvas removed with container at the end
        return
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    // Emitters across the viewport (confetti)
    const emit = () => {
      const burst = 90 + Math.floor(Math.random() * 60) // 90-150 pieces per burst
      for (let i = 0; i < burst; i++) {
        const piece = document.createElement('div')
        piece.style.position = 'absolute'
        // spawn from random point across viewport
        const x = Math.random() * 100
        const y = Math.random() * 30 + (Math.random() < 0.5 ? 0 : 70) // top 30% or bottom 30%
        piece.style.left = `${x}vw`
        piece.style.top = `${y}vh`

        // random size and shape
        const w = Math.random() * 10 + 4
        const h = Math.random() * 18 + 6
        const asCircle = Math.random() < 0.35
        piece.style.width = `${w}px`
        piece.style.height = `${h}px`
        piece.style.background = colors[Math.floor(Math.random() * colors.length)]
        piece.style.opacity = '0.95'
        piece.style.borderRadius = asCircle ? '9999px' : '3px'
        piece.style.transform = 'translate(-50%, -50%) rotate(0deg)'
        piece.style.willChange = 'transform, opacity'
        container.appendChild(piece)

        // physics
        const angle = Math.random() * Math.PI * 2
        const distance = 400 + Math.random() * 520
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance
        const rotate = (Math.random() * 1440 - 720).toFixed(1)
        const duration = 1500 + Math.random() * 1800 // 1.5s - 3.3s

        piece.animate(
          [
            { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotate}deg)`, opacity: 0 }
          ],
          { duration, easing: 'cubic-bezier(0.16, 0.8, 0.2, 1)', fill: 'forwards' }
        )

        // auto remove each piece after animation
        setTimeout(() => piece.remove(), Math.ceil(duration) + 60)
      }
    }

    // Run confetti for ~10 seconds alongside fireworks
    start = performance.now()
    emit()
    const interval = setInterval(() => {
      if (performance.now() - start > 10000) {
        clearInterval(interval)
        // allow last particles to finish then cleanup container
        window.removeEventListener('resize', resize)
        cancelAnimationFrame(rafId)
        setTimeout(() => container.remove(), 3500)
        return
      }
      emit()
    }, 300)
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
              hideable
              trend={monthTrendText}
              trendUp={monthTrendUp}
            />
            <StatCard title="Toplam Müşteri" value={totalCustomers != null ? String(totalCustomers) : '—'} icon={Users} />
            <StatCard title="Yeni Müşteri (Bu Ay)" value={newCustomersThisMonth != null ? String(newCustomersThisMonth) : '—'} icon={Users} trend={newCustomersTrendText} trendUp={newCustomersTrendUp} />
            <StatCard title="Devam Eden Projeler" value={ongoingProjects != null ? String(ongoingProjects) : '—'} icon={FolderKanban} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart
                data={chartData ?? undefined}
                totalAnnual={chartData ? chartData.reduce((s, r) => s + r.revenue, 0) : undefined}
              />
              <div className="mt-6">
                <AtusWidget />
              </div>
            </div>
            <div className="space-y-6">
              <RecentActivity />
            </div>
          </div>

          <div className="mt-6">
            <TahsilatHesaplamaWidget />
          </div>

          {/* Motive Edici Söz */}
          <div className="mt-12 text-center p-6 rounded-xl bg-linear-to-r from-primary/10 to-secondary/10 border border-border/50">
            <blockquote className="text-lg italic text-foreground/90">
              "Başarı, küçük çabaların tekrarından başka bir şey değildir."
            </blockquote>
            <p className="mt-2 text-sm text-muted-foreground">- Robert Collier</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Her gün küçük adımlarla büyük hedeflere ulaşabilirsiniz. Bugün atacağınız her adım, yarının başarısının temelini oluşturur.
            </p>
            <button
              onClick={celebrate}
              className="mt-3 text-xs text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Kutla
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
