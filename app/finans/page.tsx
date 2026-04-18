"use client"

import { useEffect, useMemo, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Money from "@/components/money"
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Percent, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react"
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Line, Legend, ComposedChart, Bar, Cell, ReferenceLine, Pie, PieChart } from "recharts"
import { Button } from "@/components/ui/button"
import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays } from "lucide-react"

type PeriodFilter = "this-month" | "last-month" | "last-3-months" | "last-6-months" | "this-year" | "all"

interface MonthlyData {
    month: string
    revenue: number
    expense: number
    profit: number
    margin: number
    projectCount: number
    web_site: number
    sosyal_medya: number
    seo_hizmeti: number
    video_cekimi: number
    baski_isleri: number
    diger: number
}

export default function FinancialAnalysisPage() {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<PeriodFilter>("this-month")
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

    // Summary stats
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalExpense, setTotalExpense] = useState(0)
    const [netProfit, setNetProfit] = useState(0)
    const [profitMargin, setProfitMargin] = useState(0)

    // Trends
    const [revenueTrend, setRevenueTrend] = useState(0)
    const [expenseTrend, setExpenseTrend] = useState(0)
    const [profitTrend, setProfitTrend] = useState(0)

    // Category breakdowns
    const [expenseByCategory, setExpenseByCategory] = useState<Array<{ name: string; value: number; color: string }>>([])
    const [revenueByType, setRevenueByType] = useState<Array<{ name: string; value: number; color: string }>>([])

    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)
        try {
            const now = new Date()
            let startDate: Date
            let endDate: Date

            switch (period) {
                case "this-month":
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                    break
                case "last-month":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
                    break
                case "last-3-months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                    break
                case "last-6-months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                    break
                case "this-year":
                    startDate = new Date(now.getFullYear(), 0, 1)
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
                    break
                default:
                    startDate = new Date(now.getFullYear() - 2, 0, 1)
                    endDate = now
            }

            // Fetch projects (revenue) - filter by payment_date or start_date
            const { data: allProjects } = await supabase
                .from('projects')
                .select('name, client, budget, payment_amount, payment_date, start_date, project_type, status')
                .neq('status', 'cancelled')

            // Fetch all expenses
            const { data: allExpenses } = await supabase
                .from('expenses')
                .select('category, amount, date')

            // For chart: always show last 12 months
            const chartStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
            const chartEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

            // Filter projects for chart (last 3 months)
            const chartProjects = (allProjects || []).filter(project => {
                const dateStr = project.payment_date || project.start_date
                if (!dateStr) return false
                const d = new Date(dateStr)
                const projectDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                const filterStartDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate())
                const filterEndDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth(), chartEndDate.getDate())
                return projectDate >= filterStartDate && projectDate <= filterEndDate
            })

            // Filter expenses for chart (last 3 months)
            const chartExpenses = (allExpenses || []).filter(expense => {
                const d = new Date(expense.date)
                const expenseDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                const filterStartDate = new Date(chartStartDate.getFullYear(), chartStartDate.getMonth(), chartStartDate.getDate())
                const filterEndDate = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth(), chartEndDate.getDate())
                return expenseDate >= filterStartDate && expenseDate <= filterEndDate
            })

            // Filter projects for selected period (for summary stats)
            const projects = (allProjects || []).filter(project => {
                const dateStr = project.payment_date || project.start_date
                if (!dateStr) return false
                const d = new Date(dateStr)
                const projectDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                const filterStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                const filterEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                return projectDate >= filterStartDate && projectDate <= filterEndDate
            })

            // Filter expenses for selected period (for summary stats)
            const expenses = (allExpenses || []).filter(expense => {
                const d = new Date(expense.date)
                const expenseDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                const filterStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                const filterEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                return expenseDate >= filterStartDate && expenseDate <= filterEndDate
            })

            // Process data: use chart data for monthly breakdown, period data for totals
            processFinancialData(chartProjects, chartExpenses, projects, expenses, chartStartDate, chartEndDate)

        } catch (error) {
            console.error('Error fetching financial data:', error)
        } finally {
            setLoading(false)
        }
    }

    const processFinancialData = (chartProjects: any[], chartExpenses: any[], periodProjects: any[], periodExpenses: any[], chartStartDate: Date, chartEndDate: Date) => {
        // Generate months - always show last 3 months for chart
        const months: { [key: string]: MonthlyData } = {}

        // Always show last 12 months
        const monthsToShow = 12

        // Generate months from oldest to newest
        for (let i = monthsToShow - 1; i >= 0; i--) {
            const d = new Date(chartEndDate.getFullYear(), chartEndDate.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = d.toLocaleString('tr-TR', { month: 'short', year: '2-digit' })
            months[key] = {
                month: label.charAt(0).toUpperCase() + label.slice(1),
                revenue: 0,
                expense: 0,
                profit: 0,
                margin: 0,
                projectCount: 0,
                web_site: 0,
                sosyal_medya: 0,
                seo_hizmeti: 0,
                video_cekimi: 0,
                baski_isleri: 0,
                diger: 0
            }
        }

        // Process chart revenue (for monthly breakdown)
        const typeRevenue: { [key: string]: number } = {}

        for (const project of chartProjects) {
            const dateStr = project.payment_date || project.start_date
            if (!dateStr) continue

            const d = new Date(dateStr)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

            const amountSource = project.payment_amount || project.budget
            const raw = String(amountSource || '').trim()
            let amount = 0;
            if (raw) {
                const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
                amount = parseFloat(normalized)
                if (!Number.isFinite(amount)) {
                    const digits = raw.replace(/\D/g, '')
                    amount = digits ? parseFloat(digits) : 0
                }
            }

            if (months[key]) {
                months[key].revenue += amount
                months[key].projectCount += 1
                const t = project.project_type || 'diger'
                if (t in months[key]) {
                    (months[key] as any)[t] += amount
                } else {
                    months[key].diger += amount
                }
            }

            const type = project.project_type || 'diger'
            typeRevenue[type] = (typeRevenue[type] || 0) + amount
        }

        // Process chart expenses (for monthly breakdown)
        const categoryExpense: { [key: string]: number } = {}

        for (const expense of chartExpenses) {
            const d = new Date(expense.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

            if (months[key]) {
                months[key].expense += expense.amount
            }

            const cat = expense.category.includes("Faturalar") ? "Faturalar" : expense.category
            categoryExpense[cat] = (categoryExpense[cat] || 0) + expense.amount
        }

        // Calculate profit and margin
        for (const key in months) {
            months[key].profit = months[key].revenue - months[key].expense
            months[key].margin = months[key].revenue > 0
                ? (months[key].profit / months[key].revenue) * 100
                : 0
        }

        // Convert to array and sort by date (oldest to newest)
        const monthlyArray = Object.keys(months)
            .sort()
            .map(key => months[key])

        setMonthlyData(monthlyArray)

        // Calculate summary stats from PERIOD data (not chart data)
        let totalRev = 0
        for (const project of periodProjects) {
            const amountSource = project.payment_amount || project.budget
            const raw = String(amountSource || '').trim()
            let amount = 0;
            if (raw) {
                const normalized = raw.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.')
                amount = parseFloat(normalized)
                if (!Number.isFinite(amount)) {
                    const digits = raw.replace(/\D/g, '')
                    amount = digits ? parseFloat(digits) : 0
                }
            }
            totalRev += amount
        }

        let totalExp = 0
        for (const expense of periodExpenses) {
            totalExp += expense.amount
        }

        // Set summary stats
        const netProf = totalRev - totalExp
        setTotalRevenue(totalRev)
        setTotalExpense(totalExp)
        setNetProfit(netProf)
        setProfitMargin(totalRev > 0 ? (netProf / totalRev) * 100 : 0)

        // Calculate trends (compare with previous period)
        if (monthlyArray.length >= 2) {
            const current = monthlyArray[monthlyArray.length - 1]
            const previous = monthlyArray[monthlyArray.length - 2]

            setRevenueTrend(previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0)
            setExpenseTrend(previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 0)
            setProfitTrend(previous.profit !== 0 ? ((current.profit - previous.profit) / Math.abs(previous.profit)) * 100 : 0)
        }

        // Expense by category
        const expCatColors: { [key: string]: string } = {
            "Yakıt": "#f97316",
            "Market": "#10b981",
            "Faturalar": "#3b82f6",
            "Kira": "#8b5cf6",
            "Yemek": "#f43f5e",
            "Dijital": "#6366f1",
            "Maaş": "#ec4899",
            "Ekipman": "#14b8a6",
            "Diğer": "#64748b"
        }

        setExpenseByCategory(
            Object.entries(categoryExpense).map(([name, value]) => ({
                name,
                value,
                color: expCatColors[name] || "#94a3b8"
            }))
        )

        // Revenue by type
        const typeColors: { [key: string]: string } = {
            "web_site": "#10b981",
            "sosyal_medya": "#3b82f6",
            "seo_hizmeti": "#f59e0b",
            "video_cekimi": "#f97316",
            "baski_isleri": "#ec4899",
            "diger": "#8b5cf6"
        }

        const typeLabels: { [key: string]: string } = {
            "web_site": "Web Sitesi",
            "sosyal_medya": "Sosyal Medya",
            "seo_hizmeti": "Seo Hizmeti",
            "video_cekimi": "Video Çekimi",
            "baski_isleri": "Baskı İşleri",
            "diger": "Diğer"
        }

        setRevenueByType(
            Object.entries(typeRevenue).map(([type, value]) => ({
                name: typeLabels[type] || type,
                value,
                color: typeColors[type] || "#94a3b8"
            }))
        )
    }

    const handleExportExcel = () => {
        const data = monthlyData.map(m => ({
            "Ay": m.month,
            "Gelir (₺)": m.revenue.toFixed(2),
            "Gider (₺)": m.expense.toFixed(2),
            "Net Kâr/Zarar (₺)": m.profit.toFixed(2),
            "Kâr Marjı (%)": m.margin.toFixed(2),
            "Proje Sayısı": m.projectCount
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Finansal Analiz")

        const dateStr = new Date().toISOString().split('T')[0]
        XLSX.writeFile(wb, `bromak_finansal_analiz_${period}_${dateStr}.xlsx`)
    }

    const formatCurrency = (value: number) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

    const BarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border shadow-2xl p-4 min-w-[160px] bg-white dark:bg-slate-950 !opacity-100 z-50 relative isolate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">{label}</p>
                    <div className="space-y-3">
                        {payload.map((item: any) => (
                            <div key={item.dataKey} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: item.color }} />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold" style={{ color: item.color }}>
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0]?.payload
            const types = [
                { key: 'web_site', label: 'Web Sitesi', color: '#6366f1' },
                { key: 'sosyal_medya', label: 'Sosyal Medya', color: '#22c55e' },
                { key: 'seo_hizmeti', label: 'Seo Hizmeti', color: '#f59e0b' },
                { key: 'video_cekimi', label: 'Video Çekimi', color: '#f97316' },
                { key: 'baski_isleri', label: 'Baskı İşleri', color: '#ec4899' },
                { key: 'diger', label: 'Diğer', color: '#64748b' },
            ]
            const activeTypes = types.filter(t => (d?.[t.key] ?? 0) > 0)
            return (
                <div className="rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm min-w-[190px]">
                    <p className="text-xs font-bold text-foreground mb-3 border-b border-border/50 pb-2">{label}</p>
                    <div className="space-y-1.5">
                        {activeTypes.map(t => (
                            <div key={t.key} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: t.color }} />
                                    <span className="text-xs text-muted-foreground">{t.label}</span>
                                </div>
                                <span className="text-xs font-semibold" style={{ color: t.color }}>{formatCurrency(d?.[t.key] ?? 0)}</span>
                            </div>
                        ))}
                        {activeTypes.length > 0 && <div className="border-t border-border/50 pt-1.5" />}
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-xs font-semibold text-muted-foreground">Toplam Gelir</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-500">{formatCurrency(d?.revenue ?? 0)}</span>
                        </div>
                        {(d?.expense ?? 0) > 0 && (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                                    <span className="text-xs text-muted-foreground">Gider</span>
                                </div>
                                <span className="text-xs font-semibold text-rose-500">{formatCurrency(d?.expense ?? 0)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <PageWrapper>
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground">Yükleniyor...</div>
                </div>
            </PageWrapper>
        )
    }

    return (
        <PageWrapper>
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Finansal Analiz</h1>
                            <p className="mt-2 text-muted-foreground">Gelir, gider ve kârlılık analizi</p>
                        </div>
                        <div className="flex gap-3">
                            <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
                                <SelectTrigger className="h-10 w-[160px] bg-background">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Zaman Filtresi" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="this-month">Bu Ay</SelectItem>
                                    <SelectItem value="last-month">Geçen Ay</SelectItem>
                                    <SelectItem value="last-3-months">Son 3 Ay</SelectItem>
                                    <SelectItem value="last-6-months">Son 6 Ay</SelectItem>
                                    <SelectItem value="this-year">Bu Yıl</SelectItem>
                                    <SelectItem value="all">Tüm Zamanlar</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" className="h-10" onClick={handleExportExcel}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Excel İndir
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Net Gelir-Gider Farkı</p>
                                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            <Money value={formatCurrency(netProfit)} />
                                        </p>
                                        {profitTrend !== 0 && (
                                            <div className={`flex items-center text-xs mt-1 ${profitTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {profitTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                {Math.abs(profitTrend).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                        {netProfit >= 0 ? <TrendingUp className="h-6 w-6 text-emerald-500" /> : <TrendingDown className="h-6 w-6 text-rose-500" />}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Toplam Gelir</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            <Money value={formatCurrency(totalRevenue)} />
                                        </p>
                                        {revenueTrend !== 0 && (
                                            <div className={`flex items-center text-xs mt-1 ${revenueTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {revenueTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                {Math.abs(revenueTrend).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-full bg-primary/10">
                                        <DollarSign className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Toplam Gider</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            <Money value={formatCurrency(totalExpense)} />
                                        </p>
                                        {expenseTrend !== 0 && (
                                            <div className={`flex items-center text-xs mt-1 ${expenseTrend >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {expenseTrend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                {Math.abs(expenseTrend).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-full bg-destructive/10">
                                        <PiggyBank className="h-6 w-6 text-destructive" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Kâr Marjı</p>
                                        <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {profitMargin.toFixed(1)}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {profitMargin >= 30 ? 'Mükemmel' : profitMargin >= 15 ? 'İyi' : profitMargin >= 0 ? 'Düşük' : 'Zarar'}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-secondary/10">
                                        <Percent className="h-6 w-6 text-secondary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Aylık Gelir ve Gider Analizi Chart */}
                    <Card className="glass-effect">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle>Aylık Finansal Özet</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">Son görünümdeki aylara ait Gelir, Gider ve Kârlılık durumu</p>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                                        Gelir
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                                        Gider
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-4 h-0.5 rounded-full bg-blue-500 inline-block" />
                                        Net Kâr
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[380px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={monthlyData} margin={{ top: 28, right: 20, left: 0, bottom: 8 }} barGap={6} barCategoryGap="20%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            dy={10}
                                        />
                                        <YAxis
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            tickFormatter={(v) => v >= 1000 ? `₺${(v / 1000).toFixed(0)}k` : `₺${v}`}
                                            width={56}
                                        />
                                        <Tooltip 
                                            content={<BarTooltip />}
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                                        />
                                        
                                        <Bar dataKey="revenue" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        <Bar dataKey="expense" name="Gider" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                        
                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            name="Net Kâr"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 2 }}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Charts */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="glass-effect">
                            <CardHeader>
                                <CardTitle>Gider Dağılımı</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {expenseByCategory.length > 0 ? (
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={expenseByCategory}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                    stroke="none"
                                                >
                                                    {expenseByCategory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Gider']}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={36} 
                                                    iconType="circle"
                                                    formatter={(value) => {
                                                        const item = expenseByCategory.find(t => t.name === value)
                                                        const total = expenseByCategory.reduce((acc, curr) => acc + curr.value, 0)
                                                        const percent = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                                                        return <span className="text-foreground font-medium ml-1">{value} <span className="text-muted-foreground ml-1">%{percent}</span></span>
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                                        Veri bulunamadı
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardHeader>
                                <CardTitle>Gelir Kaynakları</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {revenueByType.length > 0 ? (
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={revenueByType}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                    stroke="none"
                                                >
                                                    {revenueByType.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Gelir']}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                                                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '500' }}
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={36} 
                                                    iconType="circle"
                                                    formatter={(value) => {
                                                        const item = revenueByType.find(t => t.name === value)
                                                        const total = revenueByType.reduce((acc, curr) => acc + curr.value, 0)
                                                        const percent = item && total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
                                                        return <span className="text-foreground font-medium ml-1">{value} <span className="text-muted-foreground ml-1">%{percent}</span></span>
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                                        Veri bulunamadı
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Detail Table */}
                    <Card className="glass-effect">
                        <CardHeader>
                            <CardTitle>Aylık Detay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-muted-foreground border-b border-border/50">
                                            <th className="py-3 px-4">Ay</th>
                                            <th className="py-3 px-4 text-right">Gelir</th>
                                            <th className="py-3 px-4 text-right">Gider</th>
                                            <th className="py-3 px-4 text-right">Gelir-Gider Farkı</th>
                                            <th className="py-3 px-4 text-right">Kâr Marjı</th>
                                            <th className="py-3 px-4 text-right">Proje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyData.map((month, idx) => (
                                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 font-medium">{month.month}</td>
                                                <td className="py-3 px-4 text-right text-emerald-500">
                                                    <Money value={formatCurrency(month.revenue)} />
                                                </td>
                                                <td className="py-3 px-4 text-right text-rose-500">
                                                    <Money value={formatCurrency(month.expense)} />
                                                </td>
                                                <td className={`py-3 px-4 text-right font-semibold ${month.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    <Money value={formatCurrency(month.profit)} />
                                                </td>
                                                <td className={`py-3 px-4 text-right ${month.margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {month.margin.toFixed(1)}%
                                                </td>
                                                <td className="py-3 px-4 text-right text-muted-foreground">
                                                    {month.projectCount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insights & Alerts */}
                    <Card className="glass-effect">
                        <CardHeader>
                            <CardTitle>Önemli Bilgiler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {profitMargin < 15 && profitMargin >= 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-500">Düşük Kâr Marjı</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Kâr marjınız %{profitMargin.toFixed(1)} seviyesinde. Giderleri optimize etmeyi düşünün.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {netProfit < 0 && totalRevenue > 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                        <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-rose-500">Negatif Nakit Akışı</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Bu dönemde giderleriniz ({formatCurrency(totalExpense)}) gelirinizden ({formatCurrency(totalRevenue)}) {formatCurrency(Math.abs(netProfit))} fazla. Gelir artırıcı veya gider azaltıcı aksiyonlar alın.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {totalRevenue === 0 && totalExpense > 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-500">Gelir Bulunamadı</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Bu dönemde hiç gelir kaydı yok, ancak {formatCurrency(totalExpense)} gider var. Proje ekleyip ödeme tarihlerini kontrol edin.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {expenseTrend > 20 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-500">Gider Artışı</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Giderleriniz önceki döneme göre %{expenseTrend.toFixed(1)} arttı. Kontrol edin.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {profitMargin >= 30 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-500">Mükemmel Performans</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Kâr marjınız %{profitMargin.toFixed(1)} ile çok iyi durumda! Böyle devam edin.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {monthlyData.length > 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-primary">Ortalama Aylık Gelir</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatCurrency(totalRevenue / monthlyData.length)} - Son {monthlyData.length} ay ortalaması
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageWrapper>
    )
}
