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
}

const CATEGORIES = [
    "Yakıt",
    "Market",
    "Faturalar (Elektrik, dogalgaz, su,internet)",
    "Kira",
    "Yemek",
    "Dijital (Freepik, Adobe)",
    "Diğer"
]

export function AddExpenseModal({ open, onOpenChange, onSuccess }: AddExpenseModalProps) {
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
            let attachmentUrl = ""

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

            const { error } = await supabase.from('expenses').insert({
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description,
                date: new Date(form.date).toISOString(),
                attachment_url: attachmentUrl,
                installment_total: parseInt(form.installmentTotal) || 1,
                installment_current: parseInt(form.installmentCurrent) || 1,
            })

            if (error) throw error

            onSuccess()
            onOpenChange(false)
            // Reset form
            setForm({
                category: "",
                amount: "",
                description: "",
                date: new Date().toISOString().slice(0, 10),
                installmentTotal: "1",
                installmentCurrent: "1",
            })
            setFile(null)
        } catch (error) {
            console.error('Gider ekleme hatası:', error)
            alert('Gider eklenirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni Gider Ekle</DialogTitle>
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
                                type="number"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            />
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
