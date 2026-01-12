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
                                    outerRadius={90}
                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.map((entry, idx) => (
                                        <Cell key={`cat-${idx}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                                />
                                <Legend />
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
