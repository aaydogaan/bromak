"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface CategoryData {
    name: string
    value: number
    color: string
    [key: string]: any
}

export function ExpenseCategoryChart({ data }: { data: CategoryData[] }) {
    return (
        <Card className="glass-effect">
            <CardHeader>
                <CardTitle>Kategorilere Göre Harcamalar</CardTitle>
            </CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {data.map((entry, idx) => (
                                        <Cell key={`cat-${idx}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Harcama']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value, entry: any) => {
                                      const item = data.find(t => t.name === value)
                                      const total = data.reduce((acc, curr) => acc + curr.value, 0)
                                      const percent = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                                      return <span className="text-foreground font-medium ml-1">{value} <span className="text-muted-foreground ml-1">%{percent}</span></span>
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                        Veri bulunamadı.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
