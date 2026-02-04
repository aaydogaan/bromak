"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, Loader2 } from "lucide-react"

interface AddExpenseModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    editData?: any
}

const CATEGORIES = [
    "Yakıt",
    "Market",
    "Faturalar",
    "Kira",
    "Yemek",
    "Dijital",
    "Maaş",
    "Ekipman",
    "Diğer"
]

export function AddExpenseModal({ open, onOpenChange, onSuccess, editData }: AddExpenseModalProps) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        installmentTotal: "1",
        installmentCurrent: "1",
    })
    const [file, setFile] = useState<File | null>(null)
    const [previewAmount, setPreviewAmount] = useState("")

    useState(() => {
        if (editData) {
            setForm({
                category: editData.category || "",
                amount: String(editData.amount || ""),
                description: editData.description || "",
                date: editData.date ? new Date(editData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                installmentTotal: String(editData.installment_total || "1"),
                installmentCurrent: String(editData.installment_current || "1"),
            })
            setPreviewAmount(formatAmount(String(editData.amount || "")))
        }
    })

    function formatAmount(val: string) {
        if (!val) return ""
        const [whole, decimal] = val.split(".")
        const formattedWhole = Number(whole || 0).toLocaleString("tr-TR")
        if (val.includes(".")) {
            return formattedWhole + "," + (decimal || "")
        }
        return formattedWhole
    }

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value
        // Replace dot with nothing (thousands) and comma with dot (decimal)
        val = val.replace(/\./g, "").replace(/,/g, ".")

        // Allow only digits and one dot with up to 2 decimal places
        const regex = /^\d*\.?\d{0,2}$/
        if (val === "" || regex.test(val)) {
            setForm({ ...form, amount: val })
            setPreviewAmount(formatAmount(val))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSave = async () => {
        if (!form.category || !form.amount) {
            alert("Lütfen kategori ve tutar bilgilerini girin.")
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()
            let attachmentUrl = editData?.attachment_url || ""

            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `expenses/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('expenses')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('expenses')
                    .getPublicUrl(filePath)

                attachmentUrl = publicUrl
            }

            const payload = {
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description,
                date: new Date(form.date).toISOString(),
                attachment_url: attachmentUrl,
                installment_total: parseInt(form.installmentTotal) || 1,
                installment_current: parseInt(form.installmentCurrent) || 1,
            }

            if (editData) {
                const { error } = await supabase.from('expenses').update(payload).eq('id', editData.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('expenses').insert(payload)
                if (error) throw error

                // Send email notification for new expenses only
                try {
                    await fetch('/api/email/expense', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            description: form.description || form.category,
                            amount: parseFloat(form.amount),
                            category: form.category,
                            type: 'expense',
                            date: form.date,
                        }),
                    })
                } catch (emailError) {
                    console.error('Email notification error:', emailError)
                    // Don't block the main flow if email fails
                }
            }

            onSuccess()
            onOpenChange(false)
            if (!editData) {
                setForm({
                    category: "",
                    amount: "",
                    description: "",
                    date: new Date().toISOString().slice(0, 10),
                    installmentTotal: "1",
                    installmentCurrent: "1",
                })
                setPreviewAmount("")
                setFile(null)
            }
        } catch (error) {
            console.error('Gider işlemi hatası:', error)
            alert('Gider kaydedilirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-zinc-950 border-border shadow-2xl backdrop-blur-none">
                <DialogHeader>
                    <DialogTitle>{editData ? "Gideri Düzenle" : "Yeni Gider Ekle"}</DialogTitle>
                    <DialogDescription>Harcama detaylarını ve varsa faturayı girin.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Kategori</Label>
                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Tutar (₺)</Label>
                            <Input
                                id="amount"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={previewAmount}
                                onChange={handleAmountChange}
                                className="font-bold text-lg"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                * Kuruş için virgül (,) kullanın. Örn: 1629,02
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Tarih</Label>
                        <Input
                            id="date"
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                        />
                    </div>



                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama / Not</Label>
                        <Textarea
                            id="description"
                            placeholder="Gider hakkında detaylı bilgi..."
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Dosya Ekle (Fatura/Dekont)</Label>
                        <div className="mt-1 flex items-center gap-4">
                            {file ? (
                                <div className="flex flex-1 items-center justify-between rounded-lg border p-2 bg-muted/50">
                                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="relative flex-1">
                                    <input
                                        type="file"
                                        className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                    />
                                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 hover:bg-accent/50 transition-colors">
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Dosya seç veya sürükle</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
