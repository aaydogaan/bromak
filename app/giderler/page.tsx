"use client"

import { useEffect, useMemo, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Download, Filter, FileSpreadsheet, Search, Trash2, Pencil, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'
import { startOfMonth, subMonths, isAfter, parseISO } from 'date-fns'
import { createClient } from "@/lib/supabase/client"
import { ExpenseStatsCards } from "@/components/expense-stats-cards"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseCategoryChart } from "@/components/expense-category-chart"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { ExpenseDetailModal } from "@/components/expense-detail-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Money from "@/components/money"

interface Expense {
    id: string
    category: string
    amount: number
    description: string | null
    date: string
    attachment_url: string | null
    installment_total: number
    installment_current: number
    created_at: string
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [sortBy, setSortBy] = useState("date-desc")
    const [dateFilter, setDateFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const supabase = useMemo(() => createClient(), [])

    const fetchExpenses = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error
            setExpenses(data || [])
        } catch (error) {
            console.error('Giderler yüklenirken hata:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExpenses()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return
        setDeletingId(id)
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error
            setExpenses(expenses.filter(e => e.id !== id))
        } catch (error) {
            console.error('Silme hatası:', error)
            alert('Gider silinirken bir hata oluştu.')
        } finally {
            setDeletingId(null)
        }
    }

    // Filtered & Sorted Expenses
    const filteredAndSortedExpenses = useMemo(() => {
        let filtered = [...expenses]

        // Date Filter
        const now = new Date()
        if (dateFilter === "this-month") {
            const start = startOfMonth(now)
            filtered = filtered.filter(e => isAfter(parseISO(e.date), start))
        } else if (dateFilter === "last-month") {
            const start = startOfMonth(subMonths(now, 1))
            const end = startOfMonth(now)
            filtered = filtered.filter(e => {
                const date = parseISO(e.date)
                return isAfter(date, start) && !isAfter(date, end)
            })
        } else if (dateFilter === "last-3-months") {
            const start = subMonths(now, 3)
            filtered = filtered.filter(e => isAfter(parseISO(e.date), start))
        } else if (dateFilter === "last-6-months") {
            const start = subMonths(now, 6)
            filtered = filtered.filter(e => isAfter(parseISO(e.date), start))
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(e =>
                (e.description?.toLowerCase().includes(query)) ||
                (e.category.toLowerCase().includes(query))
            )
        }

        // Sorting
        if (sortBy === "date-desc") filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        if (sortBy === "date-asc") filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        if (sortBy === "amount-desc") filtered.sort((a, b) => b.amount - a.amount)
        if (sortBy === "amount-asc") filtered.sort((a, b) => a.amount - b.amount)

        return filtered
    }, [expenses, sortBy, dateFilter, searchQuery])

    // Stats based on filtered data
    const totalExpense = filteredAndSortedExpenses.reduce((s, e) => s + e.amount, 0)

    // Chart Data (Last 12 months)
    const chartData = useMemo(() => {
        const now = new Date()
        const months: { [key: string]: { month: string; amount: number } } = {}

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = d.toLocaleString('tr-TR', { month: 'short' })
            months[key] = { month: label.charAt(0).toUpperCase() + label.slice(1), amount: 0 }
        }

        filteredAndSortedExpenses.forEach(e => {
            const d = new Date(e.date)
            if (isNaN(d.getTime())) return
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (months[key]) {
                months[key].amount += e.amount
            }
        })

        return Object.values(months)
    }, [filteredAndSortedExpenses])

    // Category Data
    const categoryData = useMemo(() => {
        const cats: { [key: string]: number } = {}
        const palette: { [key: string]: string } = {
            "Yakıt": "hsl(var(--primary))",
            "Market": "hsl(var(--secondary))",
            "Faturalar": "hsl(var(--destructive))",
            "Kira": "hsl(var(--muted-foreground))",
            "Yemek": "hsl(var(--accent))",
            "Dijital (Freepik, Adobe)": "hsl(var(--primary))",
            "Diğer": "hsl(var(--border))"
        }

        filteredAndSortedExpenses.forEach(e => {
            const catName = e.category.includes("Faturalar") ? "Faturalar" : e.category
            cats[catName] = (cats[catName] || 0) + e.amount
        })

        return Object.entries(cats).map(([name, value]) => ({
            name,
            value,
            color: palette[name] || "hsl(var(--muted-foreground))"
        }))
    }, [filteredAndSortedExpenses])

    const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    const getCategoryColor = (cat: string) => {
        const colors: { [key: string]: string } = {
            "Yakıt": "bg-orange-500/10 text-orange-500 border-orange-500/20",
            "Market": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            "Faturalar": "bg-blue-500/10 text-blue-500 border-blue-500/20",
            "Kira": "bg-purple-500/10 text-purple-500 border-purple-500/20",
            "Yemek": "bg-rose-500/10 text-rose-500 border-rose-500/20",
            "Dijital (Freepik, Adobe)": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
            "Diğer": "bg-slate-500/10 text-slate-500 border-slate-500/20"
        }
        const key = cat.includes("Faturalar") ? "Faturalar" : cat
        return colors[key] || "bg-secondary/20 text-secondary-foreground"
    }

    const handleExportExcel = () => {
        const data = filteredAndSortedExpenses.map(e => ({
            "Tarih": new Date(e.date).toLocaleDateString('tr-TR'),
            "Kategori": e.category,
            "Açıklama": e.description || "-",
            "Tutar (₺)": e.amount
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Giderler")

        // Generate filename with current date filter
        const dateStr = new Date().toISOString().split('T')[0]
        XLSX.writeFile(wb, `bromak_giderler_${dateFilter}_${dateStr}.xlsx`)
    }

    return (
        <PageWrapper>
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Giderler</h1>
                            <p className="mt-2 text-muted-foreground">Şirket harcamaları ve ortak pay dağılımı</p>
                        </div>
                        <Button className="gap-2 w-full sm:w-auto" onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
                            <Plus className="h-4 w-4" />
                            Yeni Gider Ekle
                        </Button>
                    </div>

                    <ExpenseStatsCards total={totalExpense} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <ExpenseChart data={chartData} total={totalExpense} />
                        <ExpenseCategoryChart data={categoryData} />
                    </div>

                    <Card className="glass-effect">
                        <CardHeader className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center justify-between">
                            <CardTitle>Harcama Listesi</CardTitle>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Açıklama veya kategori ara..."
                                        className="pl-9 h-8 text-xs bg-background/50"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-8 text-xs"
                                        onClick={handleExportExcel}
                                        disabled={filteredAndSortedExpenses.length === 0}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                        Excel
                                    </Button>

                                    <div className="flex items-center gap-1.5 border rounded-md px-2 h-8 bg-background/50">
                                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                        <select
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="bg-transparent text-xs outline-none cursor-pointer pr-1"
                                        >
                                            <option value="all">Tüm Zamanlar</option>
                                            <option value="this-month">Bu Ay</option>
                                            <option value="last-month">Geçen Ay</option>
                                            <option value="last-3-months">Son 3 Ay</option>
                                            <option value="last-6-months">Son 6 Ay</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-1.5 border rounded-md px-2 h-8 bg-background/50">
                                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="bg-transparent text-xs outline-none cursor-pointer pr-1"
                                        >
                                            <option value="date-desc">En Yeni</option>
                                            <option value="date-asc">En Eski</option>
                                            <option value="amount-desc">En Yüksek</option>
                                            <option value="amount-asc">En Düşük</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
                            ) : expenses.length > 0 ? (
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-muted-foreground border-b border-border/50">
                                                <th className="py-3 px-4">Tarih</th>
                                                <th className="py-3 px-4">Kategori</th>
                                                <th className="py-3 px-4">Açıklama</th>
                                                <th className="py-3 px-4">Tutar</th>
                                                <th className="py-3 px-4 text-center">Belge</th>
                                                <th className="py-3 px-4 text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedExpenses.map((e) => (
                                                <tr
                                                    key={e.id}
                                                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                                                    onClick={() => setViewingExpense(e)}
                                                >
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        {new Date(e.date).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getCategoryColor(e.category)}`}>
                                                            {e.category.includes("Faturalar") ? "Faturalar" : e.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate group-hover:text-foreground transition-colors">
                                                        {e.description || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-destructive">
                                                        <Money value={tl(e.amount)} />
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {e.attachment_url ? (
                                                            <div className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                                                <Receipt className="h-4 w-4" />
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={() => { setEditingExpense(e); setIsModalOpen(true); }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(e.id)}
                                                                disabled={deletingId === e.id}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
                                    <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">Henüz bir harcama kaydı bulunmuyor.</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        * Kuruş için virgül (,) kullanın. Örn: 1629,02
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}>
                                        İlk Gideri Ekle
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AddExpenseModal
                key={editingExpense?.id || 'new'}
                open={isModalOpen}
                onOpenChange={(v) => {
                    setIsModalOpen(v)
                    if (!v) setEditingExpense(null)
                }}
                onSuccess={() => {
                    fetchExpenses()
                    setEditingExpense(null)
                }}
                editData={editingExpense}
            />

            <ExpenseDetailModal
                expense={viewingExpense}
                open={!!viewingExpense}
                onOpenChange={(v) => { if (!v) setViewingExpense(null) }}
            />
        </PageWrapper>
    )
}
