"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Banknote } from "lucide-react"
import Money from "@/components/money"

interface ExpenseStatsCardsProps {
    total: number
}

export function ExpenseStatsCards({ total }: ExpenseStatsCardsProps) {
    const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="glass-effect">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-extrabold tracking-tight text-destructive">
                        <Money value={tl(total)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Son 12 ayın toplam harcaması</p>
                </CardContent>
            </Card>

            <Card className="glass-effect overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">%40 Pay</CardTitle>
                    <div className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">%40</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <Money value={tl(total * 0.4)} />
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-effect overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">%60 Pay</CardTitle>
                    <div className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">%60</div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <Money value={tl(total * 0.6)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
