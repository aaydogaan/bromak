"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

const fallbackData = [
  { name: "Devam Ediyor", value: 8, color: "hsl(var(--primary))" },
  { name: "Planlamada", value: 3, color: "hsl(var(--secondary))" },
  { name: "Tamamlandı", value: 31, color: "hsl(var(--accent))" },
]

export function ProjectStatusChart({ data, disableFallback }: { data?: { name: string; value: number; color: string }[]; disableFallback?: boolean }) {
  const rows = disableFallback ? (data || []) : (data && data.length ? data : fallbackData)
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>Proje Durumu</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={rows}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {rows.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
