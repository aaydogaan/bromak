"use client"

import { Card, CardContent } from "@/components/ui/card"
import Money from "@/components/money"
import { TrendingDown, TrendingUp, Percent, Receipt } from "lucide-react"

interface ExpenseStatsCardsProps {
    total: number
    momChange?: number
    expenseRatio?: number
}

export function ExpenseStatsCards({ total, momChange = 0, expenseRatio = 0 }: ExpenseStatsCardsProps) {
    // 40/60 distribution
    const share40 = total * 0.4
    const share60 = total * 0.6

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-effect overflow-hidden relative group">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Receipt className="h-16 w-16" />
                </div>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Toplam Gider</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight">
                                <Money value={`₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} />
                            </span>
                            {momChange !== 0 && (
                                <div className={`flex items-center text-xs font-medium ${momChange < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {momChange < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <TrendingUp className="h-3 w-3 mr-0.5" />}
                                    %{Math.abs(momChange).toFixed(1)}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center">
                            Seçili dönemdeki toplam harcama tutarı
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-effect border-l-4 border-l-primary/50">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paylaşım (%40)</span>
                        <span className="text-2xl font-bold text-primary">
                            <Money value={`₺${share40.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} />
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '40%' }}></div>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">%40</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-effect border-l-4 border-l-secondary/50">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paylaşım (%60)</span>
                        <span className="text-2xl font-bold text-secondary">
                            <Money value={`₺${share60.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} />
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-secondary" style={{ width: '60%' }}></div>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground">%60</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
