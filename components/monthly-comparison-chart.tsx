"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data = [
  { month: "Oca", "2024": 4200, "2025": 5100 },
  { month: "Şub", "2024": 3800, "2025": 4900 },
  { month: "Mar", "2024": 5200, "2025": 6200 },
  { month: "Nis", "2024": 4600, "2025": 5800 },
  { month: "May", "2024": 5800, "2025": 6800 },
  { month: "Haz", "2024": 6200, "2025": 7200 },
  { month: "Tem", "2024": 5400, "2025": 6400 },
  { month: "Ağu", "2024": 4800, "2025": 5900 },
  { month: "Eyl", "2024": 5600, "2025": 6600 },
  { month: "Eki", "2024": 6000, "2025": 7000 },
  { month: "Kas", "2024": 5200, "2025": 6200 },
  { month: "Ara", "2024": 4900, "2025": 5800 },
]

export function MonthlyComparisonChart() {
  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle>Yıllık Karşılaştırma</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="2024" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
            <Bar dataKey="2025" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
