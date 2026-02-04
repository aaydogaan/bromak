"use client"

import { useEffect, useState, useMemo } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { LeaveStatsOverview } from "@/components/leave-stats-overview"
import { LeaveCalendarView } from "@/components/leave-calendar-view"
import { LeaveListView } from "@/components/leave-list-view"
import { AddLeaveDialog } from "@/components/add-leave-dialog"
import { EditLeaveDialog } from "@/components/edit-leave-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Calendar as CalendarIcon, List, Download, TrendingDown, TrendingUp, Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, addDays } from "date-fns"
import { useKeyboardShortcuts, useKeyboardShortcutsHelp } from "@/hooks/use-keyboard-shortcuts"
import { getLeastLeaveEmployee, getBadgeEmoji } from "@/lib/employee-stats"
import type { LeaveRecord, LeaveStats, LeaveType } from "@/types/leave"

export default function LeavePage() {
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [sortBy, setSortBy] = useState<string>("date") // New sorting state

    const supabase = useMemo(() => createClient(), [])

    const fetchLeaves = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("leave_records")
                .select("*")
                .order("start_date", { ascending: false })

            if (error) throw error
            setLeaves(data || [])
        } catch (error) {
            console.error("Error fetching leaves:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaves()
    }, [supabase])

    // Filtered leaves
    const filteredLeaves = useMemo(() => {
        const filtered = leaves.filter((leave) => {
            // Search filter
            if (searchQuery && !leave.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }

            // Type filter
            if (filterType !== "all" && leave.leave_type !== filterType) {
                return false
            }

            // Status filter
            if (filterStatus !== "all" && leave.status !== filterStatus) {
                return false
            }

            return true
        })

        // Apply sorting
        const sorted = [...filtered]
        if (sortBy === "least-days") {
            // Group by employee and sort by total days (ascending) - only approved leaves
            const employeeMap = new Map<string, { name: string; totalDays: number; leaves: LeaveRecord[] }>()
            sorted.forEach(leave => {
                // Only count approved leaves for the total
                const daysToAdd = leave.status === "approved" ? leave.total_days : 0
                const existing = employeeMap.get(leave.employee_name)
                if (existing) {
                    existing.totalDays += daysToAdd
                    existing.leaves.push(leave)
                } else {
                    employeeMap.set(leave.employee_name, {
                        name: leave.employee_name,
                        totalDays: daysToAdd,
                        leaves: [leave]
                    })
                }
            })
            const sortedEmployees = Array.from(employeeMap.values()).sort((a, b) => a.totalDays - b.totalDays)
            return sortedEmployees.flatMap(emp => emp.leaves)
        } else if (sortBy === "most-days") {
            // Group by employee and sort by total days (descending) - only approved leaves
            const employeeMap = new Map<string, { name: string; totalDays: number; leaves: LeaveRecord[] }>()
            sorted.forEach(leave => {
                // Only count approved leaves for the total
                const daysToAdd = leave.status === "approved" ? leave.total_days : 0
                const existing = employeeMap.get(leave.employee_name)
                if (existing) {
                    existing.totalDays += daysToAdd
                    existing.leaves.push(leave)
                } else {
                    employeeMap.set(leave.employee_name, {
                        name: leave.employee_name,
                        totalDays: daysToAdd,
                        leaves: [leave]
                    })
                }
            })
            const sortedEmployees = Array.from(employeeMap.values()).sort((a, b) => b.totalDays - a.totalDays)
            return sortedEmployees.flatMap(emp => emp.leaves)
        } else if (sortBy === "name") {
            sorted.sort((a, b) => a.employee_name.localeCompare(b.employee_name))
        } else if (sortBy === "duration") {
            sorted.sort((a, b) => b.total_days - a.total_days)
        } else {
            // Default: sort by date (newest first)
            sorted.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        }

        return sorted
    }, [leaves, searchQuery, filterType, filterStatus, sortBy])

    // Calculate statistics
    const stats: LeaveStats = useMemo(() => {
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Total leave days this month
        const totalLeaveDays = leaves
            .filter((leave) => {
                const start = parseISO(leave.start_date)
                const end = parseISO(leave.end_date)
                return (
                    leave.status === "approved" &&
                    (isWithinInterval(start, { start: monthStart, end: monthEnd }) ||
                        isWithinInterval(end, { start: monthStart, end: monthEnd }))
                )
            })
            .reduce((sum, leave) => sum + leave.total_days, 0)

        // People on leave today
        const onLeaveToday = leaves.filter((leave) => {
            const start = parseISO(leave.start_date)
            const end = parseISO(leave.end_date)
            return leave.status === "approved" && isWithinInterval(now, { start, end })
        }).length

        // Upcoming leaves (next 30 days)
        const next30Days = addDays(now, 30)
        const upcomingLeaves = leaves.filter((leave) => {
            const start = parseISO(leave.start_date)
            return leave.status === "approved" && start > now && start <= next30Days
        }).length

        // Leaves by type
        const leavesByType: { type: LeaveType; count: number; days: number }[] = [
            { type: "Yıllık İzin", count: 0, days: 0 },
            { type: "Hastalık İzni", count: 0, days: 0 },
            { type: "Diğer", count: 0, days: 0 },
        ]

        leaves
            .filter((leave) => leave.status === "approved")
            .forEach((leave) => {
                const item = leavesByType.find((lt) => lt.type === leave.leave_type)
                if (item) {
                    item.count++
                    item.days += leave.total_days
                }
            })

        return {
            totalLeaveDays,
            onLeaveToday,
            upcomingLeaves,
            leavesByType,
        }
    }, [leaves])

    const handleLeaveClick = (leave: LeaveRecord) => {
        setSelectedLeave(leave)
        setEditDialogOpen(true)
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        setAddDialogOpen(true)
    }

    const handleSuccess = () => {
        fetchLeaves()
    }

    const exportToCSV = () => {
        const headers = ["Ad Soyad", "İzin Türü", "Başlangıç", "Bitiş", "Toplam Gün", "Durum", "Açıklama"]
        const rows = filteredLeaves.map((leave) => [
            leave.employee_name,
            leave.leave_type,
            leave.start_date,
            leave.end_date,
            leave.total_days.toString(),
            leave.status,
            leave.description || "",
        ])

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `izinler-${new Date().toISOString().split("T")[0]}.csv`
        link.click()
    }

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: "n",
            description: "Yeni izin ekle",
            callback: () => setAddDialogOpen(true),
        },
        {
            key: "e",
            ctrlKey: true,
            description: "CSV olarak dışa aktar",
            callback: exportToCSV,
        },
    ])

    useKeyboardShortcutsHelp([
        { key: "n", description: "Yeni izin ekle", callback: () => { } },
        { key: "e", ctrlKey: true, description: "CSV olarak dışa aktar", callback: () => { } },
    ])

    return (
        <PageWrapper>
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">İzin Takip Sistemi</h1>
                            <p className="mt-2 text-muted-foreground">
                                Ekip üyelerinin izin kayıtlarını takip edin ve yönetin
                            </p>
                        </div>
                        <Button onClick={() => setAddDialogOpen(true)} size="lg" className="gap-2">
                            <Plus className="h-5 w-5" />
                            Yeni İzin
                        </Button>
                    </div>

                    {/* Statistics */}
                    <LeaveStatsOverview stats={stats} loading={loading} />

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="İsme göre ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="İzin Türü" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Türler</SelectItem>
                                <SelectItem value="Yıllık İzin">🏖️ Yıllık İzin</SelectItem>
                                <SelectItem value="Hastalık İzni">🤒 Hastalık İzni</SelectItem>
                                <SelectItem value="Diğer">📋 Diğer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Durum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Durumlar</SelectItem>
                                <SelectItem value="approved">✅ Onaylandı</SelectItem>
                                <SelectItem value="pending">⏳ Beklemede</SelectItem>
                                <SelectItem value="cancelled">❌ İptal Edildi</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={exportToCSV} className="gap-2">
                            <Download className="h-4 w-4" />
                            CSV İndir
                        </Button>
                    </div>

                    {/* Tabs: Calendar & List View */}
                    <Tabs defaultValue="calendar" className="w-full">
                        <div className="flex items-center justify-between">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="calendar" className="gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    Takvim
                                </TabsTrigger>
                                <TabsTrigger value="list" className="gap-2">
                                    <List className="h-4 w-4" />
                                    Liste
                                </TabsTrigger>
                            </TabsList>

                            {/* Sort/Filter Dropdown */}
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Sıralama" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Tarihe Göre (Yeni)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="least-days">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-green-600" />
                                            En Az İzin Kullanan
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="most-days">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-red-600" />
                                            En Çok İzin Kullanan
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="duration">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            İzin Süresine Göre
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="name">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            İsme Göre (A-Z)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <TabsContent value="calendar" className="mt-6">
                            <LeaveCalendarView
                                leaves={filteredLeaves}
                                onLeaveClick={handleLeaveClick}
                                onDayClick={handleDayClick}
                            />
                        </TabsContent>

                        <TabsContent value="list" className="mt-6">
                            <LeaveListView leaves={filteredLeaves} onLeaveClick={handleLeaveClick} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Dialogs */}
            <AddLeaveDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSuccess={handleSuccess}
                initialDate={selectedDate}
            />
            <EditLeaveDialog
                leave={selectedLeave}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={handleSuccess}
            />
        </PageWrapper>
    )
}
