"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Money from "@/components/money"
import { Trash2, Pencil } from "lucide-react"

interface PaymentRow {
  id: string
  customer_name: string
  description?: string | null
  amount_due: number
  amount_paid: number
  due_date?: string | null
  created_at?: string | null
}

function toNumber(val: string): number {
  const raw = (val || '').trim()
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9.,]/g, '')
  
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    return parseFloat(normalized) || 0
  }
  
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(',', '.')
    return parseFloat(normalized) || 0
  }
  
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    const lastPart = parts[parts.length - 1]
    if (lastPart.length === 3) {
      const normalized = cleaned.replace(/\./g, '')
      return parseFloat(normalized) || 0
    } else {
      return parseFloat(cleaned) || 0
    }
  }
  
  return parseFloat(cleaned) || 0
}

const tl = (n: number) => `₺${(n || 0).toLocaleString('tr-TR')}`

export function PaymentsTable() {
  const [rows, setRows] = useState<PaymentRow[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ customer_name: '', description: '', amount_due: '', amount_paid: '', due_date: '' })
  const supabase = useMemo(() => createClient(), [])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select('id, customer_name, description, amount_due, amount_paid, due_date, created_at')
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('payments fetch err (table may not exist yet):', error.message)
        setRows([])
      } else {
        setRows((data || []).map((r: any) => ({
          id: r.id,
          customer_name: r.customer_name,
          description: r.description,
          amount_due: Number(r.amount_due || 0),
          amount_paid: Number(r.amount_paid || 0),
          due_date: r.due_date,
          created_at: r.created_at,
        })))
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const onDelete = async (id: string) => {
    if (!id) return
    if (!confirm('Bu kaydı silmek istiyor musunuz?')) return
    try {
      setDeletingId(id)
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
      setRows(prev => (prev || []).filter(r => r.id !== id))
    } catch (e) {
      alert('Kayıt silinemedi. Lütfen tekrar deneyin.')
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  const totals = useMemo(() => {
    const list = rows || []
    const due = list.reduce((a, r) => a + (r.amount_due || 0), 0)
    const paid = list.reduce((a, r) => a + (r.amount_paid || 0), 0)
    const remain = due - paid
    return { due, paid, remain }
  }, [rows])

  const onSave = async () => {
    const payload = {
      customer_name: form.customer_name.trim(),
      description: form.description?.trim() || null,
      amount_due: toNumber(form.amount_due),
      amount_paid: toNumber(form.amount_paid),
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    }
    if (!payload.customer_name) {
      alert('Müşteri adı zorunlu')
      return
    }
    if (editingId) {
      // update
      const { data, error } = await supabase
        .from('payments')
        .update(payload)
        .eq('id', editingId)
        .select('id, customer_name, description, amount_due, amount_paid, due_date, created_at')
        .single()
      if (error) {
        alert('Kayıt güncellenemedi. Lütfen daha sonra tekrar deneyin.')
        console.error(error)
        return
      }
      setRows(prev => (prev || []).map(r => r.id === editingId ? {
        id: data.id,
        customer_name: data.customer_name,
        description: data.description,
        amount_due: Number(data.amount_due || 0),
        amount_paid: Number(data.amount_paid || 0),
        due_date: data.due_date,
        created_at: data.created_at,
      } : r))
    } else {
      // insert
      const { data, error } = await supabase
        .from('payments')
        .insert(payload)
        .select('id, customer_name, description, amount_due, amount_paid, due_date, created_at')
        .single()
      if (error) {
        alert('Kayıt eklenemedi. Lütfen daha sonra tekrar deneyin.')
        console.error(error)
        return
      }
      const row: PaymentRow = {
        id: data.id,
        customer_name: data.customer_name,
        description: data.description,
        amount_due: Number(data.amount_due || 0),
        amount_paid: Number(data.amount_paid || 0),
        due_date: data.due_date,
        created_at: data.created_at,
      }
      setRows(prev => [row, ...(prev || [])])
    }
    setOpen(false)
    setEditingId(null)
    setForm({ customer_name: '', description: '', amount_due: '', amount_paid: '', due_date: '' })
  }

  return (
    <Card className="glass-effect lg:col-span-3">
      <CardHeader className="flex items-center justify-between gap-4 sm:flex-row">
        <CardTitle>Ödemeler (Kapora ve Tahsilatlar)</CardTitle>
        <Button onClick={() => setOpen(true)}>Yeni Kayıt</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
        ) : (rows && rows.length > 0) ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Müşteri</th>
                  <th className="py-2 pr-4">Açıklama</th>
                  <th className="py-2 pr-4">Toplam Tutar</th>
                  <th className="py-2 pr-4">Alınan Tutar</th>
                  <th className="py-2 pr-4">Kalan Tutar </th>
                  <th className="py-2 pr-4">Alınan Tarih</th>
                  <th className="py-2 pr-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const remain = (r.amount_due || 0) - (r.amount_paid || 0)
                  return (
                    <tr key={r.id} className="border-t border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{r.customer_name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.description || '-'}</td>
                      <td className="py-2 pr-4"><Money value={tl(r.amount_due)} /></td>
                      <td className="py-2 pr-4"><Money value={tl(r.amount_paid)} /></td>
                      <td className={"py-2 pr-4 font-semibold " + (remain > 0 ? "text-destructive" : "text-green-600") }><Money value={tl(remain)} /></td>
                      <td className="py-2 pr-4 text-muted-foreground">{r.due_date ? new Date(r.due_date).toLocaleDateString('tr-TR') : '-'}</td>
                      <td className="py-2 pr-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent"
                            onClick={() => {
                              setEditingId(r.id)
                              setForm({
                                customer_name: r.customer_name,
                                description: r.description || '',
                                amount_due: String(r.amount_due ?? ''),
                                amount_paid: String(r.amount_paid ?? ''),
                                due_date: r.due_date ? new Date(r.due_date).toISOString().slice(0,10) : '',
                              })
                              setOpen(true)
                            }}
                            aria-label="Kaydı Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-transparent text-destructive hover:text-destructive"
                            onClick={() => onDelete(r.id)}
                            disabled={deletingId === r.id}
                            aria-label="Kaydı Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground">
            <span>Henüz kayıt yok. Kapora/ödeme ekleyin.</span>
            <Button onClick={() => setOpen(true)} variant="outline">Kayıt Ekle</Button>
          </div>
        )}

        {/* Totals - separated below to avoid mixing with table */}
        <div className="mt-6 rounded-xl border bg-card/50 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Toplam Tutar</p>
              <p className="text-base font-semibold"><Money value={tl(totals.due)} /></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Alınan Tutar</p>
              <p className="text-base font-semibold"><Money value={tl(totals.paid)} /></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kalan Tutar</p>
              <p className={"text-base font-semibold " + (totals.remain > 0 ? "text-destructive" : "text-green-600") }><Money value={tl(totals.remain)} /></p>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Ödeme Kaydını Düzenle' : 'Yeni Ödeme Kaydı'}</DialogTitle>
            <DialogDescription>Müşteri ve tutar bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="p-customer">Müşteri</Label>
              <Input id="p-customer" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-desc">Açıklama</Label>
              <Input id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              <div className="grid gap-2">
                <Label htmlFor="p-due">Alınacak Tutar</Label>
                <Input id="p-due" inputMode="decimal" value={form.amount_due} onChange={(e) => setForm({ ...form, amount_due: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-paid">Alınan Tutar</Label>
                <Input id="p-paid" inputMode="decimal" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-date">Alınan Tarih</Label>
                <Input id="p-date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={onSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
