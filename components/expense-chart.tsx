"use client"

import { Card } from "@/components/ui/card"
import Money from "@/components/money"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
                <p className="text-xs text-muted-foreground">{payload[0].payload.month}</p>
                <p className="text-base font-semibold text-destructive">₺{Number(payload[0].value || 0).toLocaleString("tr-TR")}</p>
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

export function ExpenseChart({ data, total }: { data?: { month: string; amount: number }[]; total?: number }) {
    return (
        <Card className="glass-effect p-6">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Aylık Gider Grafiği</h3>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Toplam Gider</p>
                    <p className="text-xl font-bold text-destructive"><Money value={`₺${(total || 0).toLocaleString('tr-TR')}`} /></p>
                </div>
            </div>
            <div className="mt-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.03} />
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
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#expGradient)"
                            dot={{ r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
