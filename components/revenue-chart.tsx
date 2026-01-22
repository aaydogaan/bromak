"use client"

import { Card } from "@/components/ui/card"
import Money from "@/components/money"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const fallbackData = [
  { month: "Oca", revenue: 2400 },
  { month: "Şub", revenue: 1398 },
  { month: "Mar", revenue: 3800 },
  { month: "Nis", revenue: 3908 },
  { month: "May", revenue: 4800 },
  { month: "Haz", revenue: 3800 },
  { month: "Tem", revenue: 4300 },
  { month: "Ağu", revenue: 5200 },
  { month: "Eyl", revenue: 4100 },
  { month: "Eki", revenue: 4600 },
  { month: "Kas", revenue: 5100 },
  { month: "Ara", revenue: 5800 },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const projects = data.projects || []

    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm max-w-xs">
        <p className="text-xs text-muted-foreground mb-2">{data.month}</p>
        <p className="text-base font-semibold text-primary mb-3">
          Toplam: ₺{Number(payload[0].value || 0).toLocaleString("tr-TR")}
        </p>

        {projects.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Projeler:</p>
            {projects.map((project: any, idx: number) => (
              <div key={idx} className="text-xs">
                <p className="font-medium text-foreground">{project.name}</p>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>{project.client}</span>
                  <span className="font-semibold text-primary">₺{project.amount.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  return null
}

const formatYAxis = (value: number) => {
  const n = Math.abs(value)
  if (n >= 1_000_000) return `₺${(value / 1_000_000).toFixed(1)}m`
  if (n >= 1000) return `₺${(value / 1000).toFixed(0)}k`
  return `₺${value}`
}

export function RevenueChart({ data, totalAnnual, disableFallback }: { data?: { month: string; revenue: number }[]; totalAnnual?: number; disableFallback?: boolean }) {
  const rows = disableFallback ? (data || []) : (data && data.length ? data : fallbackData)
  const total = typeof totalAnnual === 'number' ? totalAnnual : rows.reduce((s, r) => s + (r.revenue || 0), 0)
  return (
    <Card className="glass-effect p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Aylık Kazanç Grafiği</h3>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Toplam Yıllık</p>
          <p className="text-xl font-bold text-primary"><Money value={`₺${total.toLocaleString('tr-TR')}`} /></p>
        </div>
      </div>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatYAxis}
              tickLine={false}
              axisLine={false}
              width={56}
              allowDecimals={false}
              domain={[0, (dataMax: number) => Math.ceil((dataMax || 0) * 1.2)]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#revGradient)"
              dot={{ r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
