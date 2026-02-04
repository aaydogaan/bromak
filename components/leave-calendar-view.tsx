"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getLeaveTypeColor, isDateInLeavePeriod, getLeaveTypeIcon } from "@/lib/leave-utils"
import { isTurkishHoliday, getHolidayColor } from "@/lib/turkish-holidays"
import type { LeaveRecord } from "@/types/leave"

interface LeaveCalendarViewProps {
    leaves: LeaveRecord[]
    onLeaveClick: (leave: LeaveRecord) => void
    onDayClick?: (date: Date) => void
}

export function LeaveCalendarView({ leaves, onLeaveClick, onDayClick }: LeaveCalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { locale: tr })
    const calendarEnd = endOfWeek(monthEnd, { locale: tr })

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const getLeavesForDay = (day: Date) => {
        return leaves.filter((leave) =>
            isDateInLeavePeriod(day, leave.start_date, leave.end_date) &&
            leave.status === 'approved'
        )
    }

    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const goToToday = () => setCurrentMonth(new Date())

    return (
        <Card className="glass-effect">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                        {format(currentMonth, "MMMM yyyy", { locale: tr })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Bugün
                        </Button>
                        <Button variant="outline" size="icon" onClick={previousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day) => (
                        <div
                            key={day}
                            className="text-center text-sm font-semibold text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                        const dayLeaves = getLeavesForDay(day)
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isDayToday = isToday(day)
                        const holiday = isTurkishHoliday(day)
                        const holidayColors = holiday ? getHolidayColor(holiday.type) : null

                        return (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (isCurrentMonth && onDayClick) {
                                        onDayClick(day)
                                    }
                                }}
                                className={cn(
                                    "min-h-[100px] p-2 rounded-lg border transition-all relative overflow-hidden",
                                    isCurrentMonth
                                        ? "bg-card border-border cursor-pointer hover:bg-accent/50 hover:border-primary/50"
                                        : "bg-muted/30 border-muted",
                                    isDayToday && "ring-2 ring-primary ring-offset-2",
                                    holiday && holidayColors?.bg
                                )}
                                style={isDayToday ? {
                                    backgroundImage: 'url(/bromak-favicon.png)',
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundBlendMode: 'overlay'
                                } : undefined}
                            >
                                {/* Overlay for better text readability on today */}
                                {isDayToday && (
                                    <div className="absolute inset-0 bg-card/80 -z-10" />
                                )}

                                {/* Day Number */}
                                <div
                                    className={cn(
                                        "text-sm font-medium mb-1 flex items-center justify-between relative z-10",
                                        isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                                        isDayToday && "text-primary font-bold",
                                        holiday && holidayColors?.text
                                    )}
                                >
                                    <span>{format(day, "d")}</span>
                                    {holiday && (
                                        <span className="text-[10px]" title={holiday.name}>
                                            {holiday.type === 'national' ? '🇹🇷' : '🌙'}
                                        </span>
                                    )}
                                </div>

                                {/* Holiday Name */}
                                {holiday && (
                                    <div className={cn(
                                        "text-[10px] font-medium mb-1 px-1 py-0.5 rounded truncate",
                                        holidayColors?.border,
                                        "border"
                                    )}>
                                        {holiday.name}
                                    </div>
                                )}

                                {/* Leave Records */}
                                <div className="space-y-1">
                                    {dayLeaves.slice(0, 2).map((leave) => {
                                        const colors = getLeaveTypeColor(leave.leave_type)
                                        return (
                                            <button
                                                key={leave.id}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onLeaveClick(leave)
                                                }}
                                                className={cn(
                                                    "w-full text-left px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105",
                                                    colors.bg,
                                                    colors.text,
                                                    "border",
                                                    colors.border
                                                )}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>{getLeaveTypeIcon(leave.leave_type)}</span>
                                                    <span className="truncate">{leave.employee_name}</span>
                                                </div>
                                            </button>
                                        )
                                    })}

                                    {/* Show "+X more" if there are more leaves */}
                                    {dayLeaves.length > 2 && (
                                        <div className="text-xs text-muted-foreground text-center py-1">
                                            +{dayLeaves.length - 2} daha
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm text-muted-foreground">Yıllık İzin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-muted-foreground">Hastalık İzni</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-muted-foreground">Diğer</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
