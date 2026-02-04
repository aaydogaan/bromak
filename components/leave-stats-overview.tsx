"use client"

import { Calendar, Users, TrendingUp, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LeaveStats } from "@/types/leave"

interface LeaveStatsOverviewProps {
    stats: LeaveStats | null
    loading?: boolean
}

export function LeaveStatsOverview({ stats, loading }: LeaveStatsOverviewProps) {
    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="glass-effect">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Leave Days This Month */}
            <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Bu Ay Toplam İzin
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {stats.totalLeaveDays} gün
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Toplam izin günü sayısı
                    </p>
                </CardContent>
            </Card>

            {/* People on Leave Today */}
            <Card className="glass-effect border-green-500/20 hover:border-green-500/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Bugün İzinde
                    </CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {stats.onLeaveToday} kişi
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Şu anda izinde olan
                    </p>
                </CardContent>
            </Card>

            {/* Upcoming Leaves */}
            <Card className="glass-effect border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Yaklaşan İzinler
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                        {stats.upcomingLeaves}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Önümüzdeki 30 gün
                    </p>
                </CardContent>
            </Card>

            {/* Leave Type Distribution */}
            <Card className="glass-effect border-purple-500/20 hover:border-purple-500/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        İzin Türü Dağılımı
                    </CardTitle>
                    <PieChart className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {stats.leavesByType.map((item) => (
                            <div key={item.type} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{item.type}</span>
                                <span className="font-semibold text-foreground">
                                    {item.count} ({item.days}g)
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
