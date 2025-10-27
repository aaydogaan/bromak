"use client"

import { ContractCard } from "@/components/contract-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { PageWrapper } from "@/components/page-wrapper"
import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

type DBStatus = 'draft' | 'active' | 'canceled' | 'expired'
type CardStatus = 'active' | 'pending' | 'completed'
type ProjectType = 'sosyal_medya' | 'web_sitesi' | 'diger'

interface UIContract {
  id: string
  title: string
  companyName?: string | null
  amountText: string
  startText: string
  endText: string
  status: CardStatus
  progress: number
  // only for card visuals
  client: string
  project: string
  notes?: string | null
  projectType?: ProjectType | null
  depositReceived?: boolean | null
  depositAmount?: number | null
  totalPostCount?: number | null
  deliveryTerms?: string | null
  paymentPlan?: string | null
  cancellationTerms?: string | null
  preparedAtText?: string | null
  signerCompany?: string | null
  signerCustomer?: string | null
}

export default function ContractsPage() {
  const [items, setItems] = useState<UIContract[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [toDelete, setToDelete] = useState<UIContract | null>(null)
  const [editing, setEditing] = useState<UIContract | null>(null)
  const [viewing, setViewing] = useState<UIContract | null>(null)
  const [createStep, setCreateStep] = useState<number>(1)
  const [editStep, setEditStep] = useState<number>(1)

  const [form, setForm] = useState<{ title: string; company: string; amount: string; currency: string; status: DBStatus; start: string; end: string; notes: string; projectType: ProjectType | ''; depositReceived: 'evet' | 'hayir' | ''; depositAmount: string; totalPostCount: string; deliveryTerms: string; paymentPlan: string; cancellationTerms: string; preparedAt: string; signerCompany: string; signerCustomer: string }>({
    title: "",
    company: "",
    amount: "",
    currency: "TRY",
    status: "draft",
    start: "",
    end: "",
    notes: "",
    projectType: '',
    depositReceived: '',
    depositAmount: "",
    totalPostCount: "",
    deliveryTerms: "",
    paymentPlan: "",
    cancellationTerms: "",
    preparedAt: "",
    signerCompany: "Bro&Mak",
    signerCustomer: "",
  })

  const supabase = useMemo(() => createClient(), [])

  const companyLogo = (name?: string | null): string => {
    const n = (name || '').toLowerCase()
    if (n.includes('mak')) return '/mak-logo.png'
    if (n.includes('brodigital') || n.includes('brodi')) return '/brodigital-logo.png'
    return '/mak-logo.png'
  }

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        setItems((data || []).map((c: any) => mapRowToCard(c)))
      } catch (e) {
        console.error('Sözleşmeler yüklenirken hata:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchContracts()
  }, [supabase])

  const mapStatus = (s: DBStatus): CardStatus => {
    switch (s) {
      case 'active':
        return 'active'
      case 'draft':
        return 'pending'
      case 'canceled':
      case 'expired':
        return 'completed'
      default:
        return 'pending'
    }
  }

  const progressByStatus = (s: DBStatus): number => {
    switch (s) {
      case 'active':
        return 50
      case 'draft':
        return 10
      case 'canceled':
        return 0
      case 'expired':
        return 100
      default:
        return 0
    }
  }

  const mapRowToCard = (c: any): UIContract => ({
    id: String(c.id),
    title: c.title,
    companyName: c.company_name ?? null,
    amountText: c.amount != null ? `${c.amount} ${c.currency ?? 'TRY'}` : '—',
    startText: c.start_date ? new Date(c.start_date).toLocaleDateString('tr-TR') : '—',
    endText: c.end_date ? new Date(c.end_date).toLocaleDateString('tr-TR') : '—',
    status: mapStatus((c.status ?? 'draft') as DBStatus),
    progress: progressByStatus((c.status ?? 'draft') as DBStatus),
    client: c.company_name ?? '—',
    project: c.title,
    notes: c.notes ?? null,
    projectType: (c.project_type ?? null) as ProjectType | null,
    depositReceived: c.deposit_received ?? null,
    depositAmount: c.deposit_amount ?? null,
    totalPostCount: c.total_post_count ?? null,
    deliveryTerms: c.delivery_terms ?? null,
    paymentPlan: c.payment_plan ?? null,
    cancellationTerms: c.cancellation_terms ?? null,
    preparedAtText: c.prepared_at ? new Date(c.prepared_at).toLocaleDateString('tr-TR') : null,
    signerCompany: c.signer_company ?? null,
    signerCustomer: c.signer_customer ?? null,
  })

  const filtered = items.filter((it) =>
    it.title.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({
      title: "",
      company: "",
      amount: "",
      currency: "TRY",
      status: "draft",
      start: "",
      end: "",
      notes: "",
      projectType: '',
      depositReceived: '',
      depositAmount: "",
      totalPostCount: "",
      deliveryTerms: "",
      paymentPlan: "",
      cancellationTerms: "",
      preparedAt: "",
      signerCompany: "Bro&Mak",
      signerCustomer: "",
    })
    setCreateStep(1)
    setIsCreateOpen(true)
  }

  const openEdit = (contract: UIContract) => {
    setEditing(contract)
    setForm({
      title: contract.title,
      company: contract.client === '—' ? '' : contract.client,
      amount: contract.amountText.split(' ')[0].replace(/[^0-9.,-]/g, ''),
      currency: contract.amountText.split(' ')[1] ?? 'TRY',
      status: (contract.status === 'active' ? 'active' : contract.status === 'pending' ? 'draft' : 'expired'),
      start: "",
      end: "",
      notes: contract.notes ?? "",
      projectType: (contract.projectType ?? '') as ProjectType | '',
      depositReceived: contract.depositReceived == null ? '' : (contract.depositReceived ? 'evet' : 'hayir'),
      depositAmount: contract.depositAmount != null ? String(contract.depositAmount) : "",
      totalPostCount: contract.totalPostCount != null ? String(contract.totalPostCount) : "",
      deliveryTerms: contract.deliveryTerms ?? "",
      paymentPlan: contract.paymentPlan ?? "",
      cancellationTerms: contract.cancellationTerms ?? "",
      preparedAt: contract.preparedAtText ? new Date(contract.preparedAtText.split('.').reverse().join('-')).toISOString().slice(0,10) : "",
      signerCompany: contract.signerCompany ?? "Bro&Mak",
      signerCustomer: contract.signerCustomer ?? "",
    })
    setIsEditOpen(true)
    setEditStep(1)
  }

  const openView = (contract: UIContract) => {
    setViewing(contract)
    setIsViewOpen(true)
  }

  const handleDownload = (contract: UIContract) => {
    const logoLeft = '/mak-logo.png'
    const logoRight = '/brodigital-logo.jpg'
    const amtDigits = (contract.amountText || '').replace(/[^0-9]/g, '')
    const formattedAmount = amtDigits ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(amtDigits)) : (contract.amountText || '—')
    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${contract.title} - Sözleşme</title>
  <style>
    :root{--fg:#111827;--muted:#6b7280;--border:#e5e7eb}
    html,body{height:100%}
    body{font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:var(--fg); margin:20px}
    .header{display:flex; justify-content:space-between; align-items:center; margin-bottom:12px}
    .header img{height:44px; object-fit:contain}
    .title{font-size:18px; font-weight:700; margin:0 0 8px; text-align:center}
    .meta{width:100%; border:1px solid var(--border); border-collapse:collapse; font-size:12px}
    .meta td{border:1px solid var(--border); padding:6px 8px; vertical-align:top}
    .meta td.label{color:var(--muted); width:180px}
    .section{margin-top:12px}
    .section-title{font-weight:700; font-size:13px; margin:0 0 4px}
    .box{white-space:pre-wrap; border:1px solid var(--border); padding:10px; border-radius:8px; min-height:60px; font-size:12px}
    .row{display:grid; grid-template-columns:1fr 1fr; gap:10px}
    .signatures{display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:18px}
    .sig{border:1px solid var(--border); border-radius:8px; padding:10px; height:90px; display:flex; flex-direction:column; justify-content:flex-end}
    .sig .name{font-weight:700; margin-top:6px}
    .sig .role{color:var(--muted); font-size:11px}
    .logos{display:flex; justify-content:center; gap:24px; margin-top:18px}
    .logos img{height:32px; object-fit:contain}
    @page { size: A4; margin: 8mm }
    @media print{ .no-print{ display:none } body{margin:8mm} }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoLeft}" alt="MAK" />
    <img src="${logoRight}" alt="Brodigital" />
  </div>
  <h1 class="title">${contract.title}</h1>
  <table class="meta">
    <tr><td class="label">Firma</td><td>${contract.companyName || contract.client || '—'}</td></tr>
    <tr><td class="label">Tutar</td><td>${formattedAmount}</td></tr>
    <tr><td class="label">Kapora</td><td>${contract.depositReceived == null ? '—' : (contract.depositReceived ? 'Evet' : 'Hayır')}</td></tr>
    <tr><td class="label">Kapora Tutarı</td><td>${contract.depositAmount ?? '—'}</td></tr>
    <tr><td class="label">Toplam Paylaşım</td><td>${contract.totalPostCount ?? '—'}</td></tr>
    <tr><td class="label">Başlangıç</td><td>${contract.startText}</td></tr>
    <tr><td class="label">Bitiş</td><td>${contract.endText}</td></tr>
    <tr><td class="label">Hazırlanma Tarihi</td><td>${contract.preparedAtText ?? '—'}</td></tr>
  </table>

  <div class="section">
    <div class="section-title">Açıklama</div>
    <div class="box">${contract.notes ?? '—'}</div>
  </div>

  <div class="row section">
    <div>
      <div class="section-title">Teslim Şartı</div>
      <div class="box">${contract.deliveryTerms ?? '—'}</div>
    </div>
    <div>
      <div class="section-title">Ödeme Planı</div>
      <div class="box">${contract.paymentPlan ?? '—'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">İptal Koşulları</div>
    <div class="box">${contract.cancellationTerms ?? '—'}</div>
  </div>

  <div class="signatures">
    <div class="sig">
      <div class="line" style="border-top:1px solid var(--border);"></div>
      <div class="name">${contract.signerCompany || 'Bro&Mak'}</div>
      <div class="role">İmza</div>
    </div>
    <div class="sig">
      <div class="line" style="border-top:1px solid var(--border);"></div>
      <div class="name">${contract.signerCustomer || (contract.companyName || contract.client || 'Müşteri')}</div>
      <div class="role">İmza</div>
    </div>
  </div>

  <script>
    window.onload = () => { window.print(); }
  </script>
</body>
</html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  const handleCreate = async () => {
    try {
      const payload: any = {
        title: form.title,
        company_name: form.company || null,
        amount: form.amount ? Number(form.amount) : null,
        currency: form.currency || 'TRY',
        status: form.status,
        start_date: form.start ? new Date(form.start).toISOString() : null,
        end_date: form.end ? new Date(form.end).toISOString() : null,
        notes: form.notes || null,
        project_type: form.projectType || null,
        deposit_received: form.depositReceived === '' ? null : form.depositReceived === 'evet',
        deposit_amount: form.depositAmount ? Number(form.depositAmount) : null,
        total_post_count: form.totalPostCount ? Number(form.totalPostCount) : null,
        delivery_terms: form.deliveryTerms || null,
        payment_plan: form.paymentPlan || null,
        cancellation_terms: form.cancellationTerms || null,
        prepared_at: form.preparedAt ? new Date(form.preparedAt).toISOString().slice(0,10) : null,
        signer_company: form.signerCompany || null,
        signer_customer: form.signerCustomer || null,
      }
      const { data, error } = await supabase.from('contracts').insert(payload).select('*').single()
      if (error) throw error
      setItems((prev) => [mapRowToCard(data), ...prev])
      setIsCreateOpen(false)
    } catch (e) {
      console.error('Sözleşme eklenirken hata:', e)
      alert('Sözleşme eklenirken bir hata oluştu.')
    }
  }

  const handleEdit = async () => {
    if (!editing) return
    try {
      const payload: any = {
        title: form.title,
        amount: form.amount ? Number(form.amount) : null,
        currency: form.currency || 'TRY',
        status: form.status,
        start_date: form.start ? new Date(form.start).toISOString() : null,
        end_date: form.end ? new Date(form.end).toISOString() : null,
        notes: form.notes || null,
      }
      const { data, error } = await supabase.from('contracts').update(payload).eq('id', editing.id).select('*').single()
      if (error) throw error
      setItems((prev) => prev.map((it) => (it.id === editing.id ? mapRowToCard(data) : it)))
      setIsEditOpen(false)
      setEditing(null)
    } catch (e) {
      console.error('Sözleşme güncellenirken hata:', e)
      alert('Sözleşme güncellenirken bir hata oluştu.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id)
      if (error) throw error
      setItems((prev) => prev.filter((it) => it.id !== id))
      setToDelete(null)
    } catch (e) {
      console.error('Sözleşme silinirken hata:', e)
      alert('Sözleşme silinirken bir hata oluştu.')
    }
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sözleşmeler</h1>
              <p className="mt-2 text-muted-foreground">Tüm sözleşmelerinizi görüntüleyin ve yönetin</p>
            </div>
            <Button className="gap-2 w-full sm:w-auto" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Yeni Sözleşme
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Sözleşme ara..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              Filtrele
            </Button>
          </div>

          <div className="space-y-4">
            {filtered.map((contract) => (
              <div key={contract.id} className="relative">
                <ContractCard onView={() => openView(contract)} onDownload={() => handleDownload(contract)} contract={{
                  id: 0,
                  title: contract.title,
                  client: contract.client,
                  project: contract.project,
                  amount: contract.amountText,
                  startDate: contract.startText,
                  endDate: contract.endText,
                  status: contract.status,
                  progress: contract.progress,
                }} />
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent" onClick={() => openEdit(contract)}>Düzenle</Button>
                  <Button variant="outline" size="sm" className="text-destructive bg-transparent hover:bg-destructive/10" onClick={() => setToDelete(contract)}>Sil</Button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">Kayıt bulunamadı.</div>
            )}
          </div>
        </div>
      </div>

      {/* Yeni Sözleşme */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Sözleşme</DialogTitle>
            <DialogDescription>Sözleşme bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="mb-2 flex items-center justify-center gap-3 text-xs">
            {[1,2,3].map((n) => (
              <div key={n} className={`flex items-center gap-2 ${createStep === n ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${createStep === n ? 'bg-primary text-primary-foreground border-primary' : ''}`}>{n}</div>
                <span className="hidden sm:inline">{n === 1 ? 'Bilgiler' : n === 2 ? 'Detaylar' : 'Koşullar & İmza'}</span>
                {n !== 3 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {createStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ct-title">Başlık</Label>
                  <Input id="ct-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ct-company">Firma Adı</Label>
                  <Input id="ct-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Proje Türü</Label>
                  <Select value={form.projectType} onValueChange={(v: ProjectType | '') => setForm({ ...form, projectType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sosyal_medya">Sosyal Medya</SelectItem>
                      <SelectItem value="web_sitesi">Web Sitesi</SelectItem>
                      <SelectItem value="diger">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {createStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="ct-amount">Tutar</Label>
                    <Input id="ct-amount" inputMode="decimal" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Durum</Label>
                    <Select value={form.status} onValueChange={(v: DBStatus) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Taslak</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="canceled">İptal</SelectItem>
                        <SelectItem value="expired">Bitti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Kapora Alındı mı?</Label>
                    <Select value={form.depositReceived} onValueChange={(v: 'evet'|'hayir'|'') => setForm({ ...form, depositReceived: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evet">Evet</SelectItem>
                        <SelectItem value="hayir">Hayır</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Kapora Tutarı</Label>
                    <Input inputMode="decimal" type="number" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Toplam Paylaşım Sayısı</Label>
                    <Input inputMode="numeric" type="number" value={form.totalPostCount} onChange={(e) => setForm({ ...form, totalPostCount: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Hazırlanma Tarihi</Label>
                    <Input type="date" value={form.preparedAt} onChange={(e) => setForm({ ...form, preparedAt: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
            {createStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ct-notes">Açıklama</Label>
                  <Textarea id="ct-notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Ödeme Planı</Label>
                    <Textarea rows={3} value={form.paymentPlan} onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>İptal Koşulları</Label>
                    <Textarea rows={3} value={form.cancellationTerms} onChange={(e) => setForm({ ...form, cancellationTerms: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>İmza - Bro&Mak</Label>
                    <Input value={form.signerCompany} onChange={(e) => setForm({ ...form, signerCompany: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>İmza - Müşteri</Label>
                    <Input value={form.signerCustomer} onChange={(e) => setForm({ ...form, signerCustomer: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <div className="flex-1" />
            {createStep > 1 && (
              <Button variant="outline" onClick={() => setCreateStep((s) => Math.max(1, s - 1))}>Geri</Button>
            )}
            {createStep < 3 ? (
              <Button onClick={() => setCreateStep((s) => Math.min(3, s + 1))} disabled={createStep === 1 && (!form.title?.trim() || !form.company?.trim())}>Devam</Button>
            ) : (
              <Button onClick={handleCreate}>Kaydet</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Görüntüle */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.title ?? 'Sözleşme'}</DialogTitle>
            <DialogDescription>Sözleşme detayları</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Tutar</div>
              <div className="font-medium">{viewing?.amountText ?? '—'}</div>
              <div className="text-muted-foreground">Firma</div>
              <div className="font-medium">{viewing?.companyName || viewing?.client || '—'}</div>
              <div className="text-muted-foreground">Proje Türü</div>
              <div className="font-medium capitalize">{viewing?.projectType ?? '—'}</div>
              <div className="text-muted-foreground">Başlangıç</div>
              <div className="font-medium">{viewing?.startText ?? '—'}</div>
              <div className="text-muted-foreground">Bitiş</div>
              <div className="font-medium">{viewing?.endText ?? '—'}</div>
              <div className="text-muted-foreground">Durum</div>
              <div className="font-medium capitalize">{viewing?.status ?? '—'}</div>
              <div className="text-muted-foreground">Kapora</div>
              <div className="font-medium">{viewing?.depositReceived == null ? '—' : (viewing?.depositReceived ? 'Evet' : 'Hayır')}</div>
              <div className="text-muted-foreground">Kapora Tutarı</div>
              <div className="font-medium">{viewing?.depositAmount != null ? viewing.depositAmount : '—'}</div>
              <div className="text-muted-foreground">Toplam Paylaşım</div>
              <div className="font-medium">{viewing?.totalPostCount != null ? viewing.totalPostCount : '—'}</div>
              <div className="text-muted-foreground">Hazırlanma Tarihi</div>
              <div className="font-medium">{viewing?.preparedAtText ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Açıklama</div>
              <div className="mt-1 whitespace-pre-wrap">{viewing?.notes ?? '—'}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Teslim Şartı</div>
                <div className="mt-1 whitespace-pre-wrap">{viewing?.deliveryTerms ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ödeme Planı</div>
                <div className="mt-1 whitespace-pre-wrap">{viewing?.paymentPlan ?? '—'}</div>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">İptal Koşulları</div>
              <div className="mt-1 whitespace-pre-wrap">{viewing?.cancellationTerms ?? '—'}</div>
            </div>
            <div className="flex items-center justify-center gap-6 pt-12">
              <img src="/brodigital-logo.jpg" alt="Brodigital" className="h-10 w-auto object-contain" />
              <img src="/mak-logo.png" alt="Mak" className="h-10 w-auto object-contain" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Düzenle */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sözleşmeyi Düzenle</DialogTitle>
            <DialogDescription>Bilgileri güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="mb-2 flex items-center justify-center gap-3 text-xs">
            {[1,2,3].map((n) => (
              <div key={n} className={`flex items-center gap-2 ${editStep === n ? 'text-foreground' : 'text-muted-foreground'}`}>
                <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${editStep === n ? 'bg-primary text-primary-foreground border-primary' : ''}`}>{n}</div>
                <span className="hidden sm:inline">{n === 1 ? 'Bilgiler' : n === 2 ? 'Detaylar' : 'Koşullar & İmza'}</span>
                {n !== 3 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {editStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ed-title">Başlık</Label>
                  <Input id="ed-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ed-company">Firma Adı</Label>
                  <Input id="ed-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Proje Türü</Label>
                  <Select value={form.projectType} onValueChange={(v: ProjectType | '') => setForm({ ...form, projectType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sosyal_medya">Sosyal Medya</SelectItem>
                      <SelectItem value="web_sitesi">Web Sitesi</SelectItem>
                      <SelectItem value="diger">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {editStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="ed-amount">Tutar</Label>
                    <Input id="ed-amount" inputMode="decimal" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Para Birimi</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Para birimi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Durum</Label>
                    <Select value={form.status} onValueChange={(v: DBStatus) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Taslak</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="canceled">İptal</SelectItem>
                        <SelectItem value="expired">Bitti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Kapora Alındı mı?</Label>
                    <Select value={form.depositReceived} onValueChange={(v: 'evet'|'hayir'|'') => setForm({ ...form, depositReceived: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evet">Evet</SelectItem>
                        <SelectItem value="hayir">Hayır</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Kapora Tutarı</Label>
                    <Input inputMode="decimal" type="number" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Toplam Paylaşım Sayısı</Label>
                    <Input inputMode="numeric" type="number" value={form.totalPostCount} onChange={(e) => setForm({ ...form, totalPostCount: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Hazırlanma Tarihi</Label>
                    <Input type="date" value={form.preparedAt} onChange={(e) => setForm({ ...form, preparedAt: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
            {editStep === 3 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="ed-notes">Açıklama</Label>
                  <Textarea id="ed-notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Ödeme Planı</Label>
                    <Textarea rows={3} value={form.paymentPlan} onChange={(e) => setForm({ ...form, paymentPlan: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>İptal Koşulları</Label>
                    <Textarea rows={3} value={form.cancellationTerms} onChange={(e) => setForm({ ...form, cancellationTerms: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>İmza - Bro&Mak</Label>
                    <Input value={form.signerCompany} onChange={(e) => setForm({ ...form, signerCompany: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>İmza - Müşteri</Label>
                    <Input value={form.signerCustomer} onChange={(e) => setForm({ ...form, signerCustomer: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <div className="flex-1" />
            {editStep > 1 && (
              <Button variant="outline" onClick={() => setEditStep((s) => Math.max(1, s - 1))}>Geri</Button>
            )}
            {editStep < 3 ? (
              <Button onClick={() => setEditStep((s) => Math.min(3, s + 1))} disabled={editStep === 1 && (!form.title?.trim() || !form.company?.trim())}>Devam</Button>
            ) : (
              <Button onClick={handleEdit}>Kaydet</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onayı */}
      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sözleşmeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.title ? `"${toDelete.title}" sözleşmesini silmek istediğinize emin misiniz?` : 'Bu sözleşmeyi silmek istediğinize emin misiniz?'} Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => toDelete && handleDelete(toDelete.id)}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
