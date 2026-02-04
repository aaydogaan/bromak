"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp } from "lucide-react"
import { isWithinInterval, parseISO, startOfWeek, endOfWeek, isToday } from "date-fns"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import type { LeaveRecord } from "@/types/leave"

interface LeaveWidgetProps {
    leaves: LeaveRecord[]
}

export function LeaveWidget({ leaves }: LeaveWidgetProps) {
    const now = new Date()
    const weekStart = startOfWeek(now, { locale: tr })
    const weekEnd = endOfWeek(now, { locale: tr })

    // People on leave today
    const onLeaveToday = leaves.filter((leave) => {
        const start = parseISO(leave.start_date)
        const end = parseISO(leave.end_date)
        return leave.status === "approved" && isWithinInterval(now, { start, end })
    })

    // People on leave this week
    const onLeaveThisWeek = leaves.filter((leave) => {
        const start = parseISO(leave.start_date)
        const end = parseISO(leave.end_date)
        return (
            leave.status === "approved" &&
            (isWithinInterval(start, { start: weekStart, end: weekEnd }) ||
                isWithinInterval(end, { start: weekStart, end: weekEnd }) ||
                (start <= weekStart && end >= weekEnd))
        )
    })

    // Get unique employees on leave this week
    const uniqueEmployeesThisWeek = Array.from(
        new Set(onLeaveThisWeek.map((l) => l.employee_name))
    )

    return (
        <Card className="glass-effect">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    İzin Durumu
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 space-y-3">
                {/* Today's Leaves */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Bugün</span>
                        <span className="text-sm font-bold">{onLeaveToday.length}</span>
                    </div>
                    {onLeaveToday.length > 0 && (
                        <div className="space-y-0.5">
                            {onLeaveToday.slice(0, 2).map((leave) => (
                                <div key={leave.id} className="flex items-center gap-1">
                                    <div className="h-1 w-1 rounded-full bg-primary" />
                                    <span className="text-[10px] truncate">{leave.employee_name.split(' ')[0]}</span>
                                </div>
                            ))}
                            {onLeaveToday.length > 2 && (
                                <span className="text-[9px] text-muted-foreground pl-2">+{onLeaveToday.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* This Week's Leaves */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Bu Hafta</span>
                        <span className="text-sm font-bold">{uniqueEmployeesThisWeek.length}</span>
                    </div>
                    {uniqueEmployeesThisWeek.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                            {uniqueEmployeesThisWeek.slice(0, 3).map((name) => (
                                <Badge key={name} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                    {name.split(' ')[0]}
                                </Badge>
                            ))}
                            {uniqueEmployeesThisWeek.length > 3 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                    +{uniqueEmployeesThisWeek.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
