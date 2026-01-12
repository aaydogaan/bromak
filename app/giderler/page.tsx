"use client"

import { useEffect, useMemo, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { Button } from "@/components/ui/button"
import { Plus, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ExpenseStatsCards } from "@/components/expense-stats-cards"
import { ExpenseChart } from "@/components/expense-chart"
import { ExpenseCategoryChart } from "@/components/expense-category-chart"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { ExpenseDetailModal } from "@/components/expense-detail-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Money from "@/components/money"
import { Trash2, ExternalLink, Pencil, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

    // Sorted Expenses
    const sortedExpenses = useMemo(() => {
        const sorted = [...expenses]
        if (sortBy === "date-desc") sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        if (sortBy === "date-asc") sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        if (sortBy === "amount-desc") sorted.sort((a, b) => b.amount - a.amount)
        if (sortBy === "amount-asc") sorted.sort((a, b) => a.amount - b.amount)
        return sorted
    }, [expenses, sortBy])

    // Stats
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)

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

        expenses.forEach(e => {
            const d = new Date(e.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (months[key]) {
                months[key].amount += e.amount
            }
        })

        return Object.values(months)
    }, [expenses])

    // Category Data
    const categoryData = useMemo(() => {
        const cats: { [key: string]: number } = {}
        const palette: { [key: string]: string } = {
            "Yakıt": "hsl(var(--primary))",
            "Market": "hsl(var(--secondary))",
            "Faturalar (Elektrik, dogalgaz, su,internet)": "hsl(var(--destructive))",
            "Kira": "hsl(var(--muted-foreground))",
            "Yemek": "hsl(var(--accent))",
            "Dijital (Freepik, Adobe)": "hsl(var(--primary))",
            "Diğer": "hsl(var(--border))"
        }

        expenses.forEach(e => {
            cats[e.category] = (cats[e.category] || 0) + e.amount
        })

        return Object.entries(cats).map(([name, value]) => ({
            name,
            value,
            color: palette[name] || "hsl(var(--muted-foreground))"
        }))
    }, [expenses])

    const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`

    const getCategoryColor = (cat: string) => {
        const colors: { [key: string]: string } = {
            "Yakıt": "bg-orange-500/10 text-orange-500 border-orange-500/20",
            "Market": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            "Faturalar (Elektrik, dogalgaz, su,internet)": "bg-blue-500/10 text-blue-500 border-blue-500/20",
            "Kira": "bg-purple-500/10 text-purple-500 border-purple-500/20",
            "Yemek": "bg-rose-500/10 text-rose-500 border-rose-500/20",
            "Dijital (Freepik, Adobe)": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
            "Diğer": "bg-slate-500/10 text-slate-500 border-slate-500/20"
        }
        return colors[cat] || "bg-secondary/20 text-secondary-foreground"
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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Harcama Listesi</CardTitle>
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                        <SelectValue placeholder="Sırala" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-desc">En Yeni</SelectItem>
                                        <SelectItem value="date-asc">En Eski</SelectItem>
                                        <SelectItem value="amount-desc">En Yüksek Tutar</SelectItem>
                                        <SelectItem value="amount-asc">En Düşük Tutar</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                            {sortedExpenses.map((e) => (
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
                                                            {e.category}
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
