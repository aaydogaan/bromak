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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Money from "@/components/money"
import { Trash2, ExternalLink } from "lucide-react"

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
    const [deletingId, setDeletingId] = useState<string | null>(null)

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

    return (
        <PageWrapper>
            <div className="p-4 md:p-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Giderler</h1>
                            <p className="mt-2 text-muted-foreground">Şirket harcamaları ve ortak pay dağılımı</p>
                        </div>
                        <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
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
                        <CardHeader>
                            <CardTitle>Harcama Listesi</CardTitle>
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
                                            {expenses.map((e) => (
                                                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 px-4 whitespace-nowrap">
                                                        {new Date(e.date).toLocaleDateString('tr-TR')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-secondary/20 text-secondary-foreground">
                                                            {e.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                                                        {e.description || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-destructive">
                                                        <Money value={tl(e.amount)} />
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {e.attachment_url ? (
                                                            <a
                                                                href={e.attachment_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                <Receipt className="h-4 w-4" />
                                                            </a>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(e.id)}
                                                            disabled={deletingId === e.id}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                                    <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                                        İlk Gideri Ekle
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AddExpenseModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={fetchExpenses}
            />
        </PageWrapper>
    )
}
