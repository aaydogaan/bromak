"use client"

import { useEffect, useState } from "react"
import { PageWrapper } from "@/components/page-wrapper"
import { ClientCard } from "@/components/client-card"
import { ClientDetailsModal } from "@/components/client-details-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Client {
  id: number
  // Veritabanındaki gerçek UUID
  dbId?: string
  name: string
  email: string
  phone: string
  company: string
  customer_type?: 'Bireysel' | 'Kurumsal'
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalRevenue: string
  status: "active" | "inactive"
  projectStatus: "ongoing" | "completed" | "paused"
  joinDate: string
  rawJoinDate?: string
  logo?: string
  address?: string
  notes?: string
}

const parseTurkishNumber = (value: string): number => {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9.,]/g, '')
  
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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])


  // Supabase'den müşterileri ve projeleri çek, geliri dinamik hesapla
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const supabase = createClient()

        // Müşterileri ve projeleri paralel çek
        const [{ data, error }, { data: projects }] = await Promise.all([
          supabase.from('customers').select('*').order('created_at', { ascending: false }),
          supabase.from('projects').select('client, budget, payment_amount, status')
        ])

        if (error) throw error

        // Müşteri adına göre proje bütçelerini topla
        const revenueMap: Record<string, number> = {}
        const projectCountMap: Record<string, number> = {}
        const activeCountMap: Record<string, number> = {}
        const completedCountMap: Record<string, number> = {}

        for (const p of projects || []) {
          const key = (p.client || '').trim().toLowerCase()
          if (!key) continue
          const rawAmount = String(p.payment_amount || p.budget || '0');
          const amount = parseTurkishNumber(rawAmount)
          revenueMap[key] = (revenueMap[key] || 0) + amount
          projectCountMap[key] = (projectCountMap[key] || 0) + 1
          if (p.status === 'in_progress' || p.status === 'planning') {
            activeCountMap[key] = (activeCountMap[key] || 0) + 1
          }
          if (p.status === 'completed') {
            completedCountMap[key] = (completedCountMap[key] || 0) + 1
          }
        }

        const formatted: Client[] = (data || []).map((c: any, idx: number) => {
          const fullName = [c.first_name, (c.last_name && c.last_name !== '-') ? c.last_name : ''].filter(Boolean).join(' ')
          const key = fullName.trim().toLowerCase()
          const dynamicRevenue = revenueMap[key] ?? 0

          return {
            id: idx + 1,
            dbId: c.id,
            name: fullName,
            email: c.email,
            phone: c.phone,
            company: c.company || (c.customer_type || 'Bireysel'),
            customer_type: c.customer_type,
            totalProjects: projectCountMap[key] ?? 0,
            activeProjects: activeCountMap[key] ?? 0,
            completedProjects: completedCountMap[key] ?? 0,
            totalRevenue: `₺${dynamicRevenue.toLocaleString('tr-TR')}`,
            status: (c.status === 'Aktif' ? 'active' : 'inactive'),
            projectStatus: (c.project_status ?? 'ongoing') as "ongoing" | "completed" | "paused",
            joinDate: c.join_date ? new Date(c.join_date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : '',
            rawJoinDate: c.join_date || null,
            logo: c.logo || undefined,
            address: c.address || [c.city, c.country].filter(Boolean).join(', '),
            notes: c.notes || undefined,
          }
        })
        setClients(formatted)
      } catch (e) {
        console.error('Müşteriler yüklenirken hata:', e)
      }
    }
    fetchClients()
  }, [])

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", income: "", notes: "", projectStatus: "ongoing" as "ongoing" | "completed" | "paused", joinDate: "" })
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", company: "", income: "", notes: "", projectStatus: "ongoing" as "ongoing" | "completed" | "paused", joinDate: new Date().toISOString().slice(0, 10) })
  const [createStep, setCreateStep] = useState(1)

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setIsDetailsModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    // TL formatlı metinden sayıyı çıkar
    const incomeNumber = (() => {
      try {
        const num = parseTurkishNumber(client.totalRevenue || '')
        return num > 0 ? String(num) : ''
      } catch {
        return ''
      }
    })()
    setEditForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      income: incomeNumber,
      notes: client.notes || "",
      projectStatus: client.projectStatus,
      joinDate: client.rawJoinDate ? String(client.rawJoinDate).slice(0, 10) : "",
    })
    setIsEditOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingClient || !editingClient.dbId) {
      alert("Veritabanı kimliği bulunamadı.")
      return
    }

    const [first_name, ...rest] = editForm.name.trim().split(" ")
    let last_name = rest.join(" ")
    if (!last_name || last_name.trim() === "") {
      // last_name boş kalırsa mevcut isimden parçala, yoksa boş bırak
      const parts = (editingClient.name || "").trim().split(" ")
      last_name = parts.length > 1 ? parts.slice(1).join(" ") : ""
    }

    try {
      const supabase = createClient()
      // Güncelleme payload'u: customer_type sadece geçerli ise gönder
      const payload: any = {
        first_name,
        last_name,
        email: editForm.email,
        phone: editForm.phone,
      }
      // Gelir ve notlar
      const incomeVal = parseFloat((editForm.income || '').replace(/[^0-9.\-]/g, ''))
      if (Number.isFinite(incomeVal)) {
        payload.total_income = incomeVal
      }
      if (typeof editForm.notes === 'string') {
        payload.notes = editForm.notes
      }
      const normalized = (editForm.company || '').trim()
      if (normalized === 'Bireysel' || normalized === 'Kurumsal') {
        payload.customer_type = normalized
      }
      if (editForm.projectStatus) {
        payload.project_status = editForm.projectStatus
      }
      const { error } = await supabase
        .from('customers')
        .update({
          ...payload,
          ...(editForm.joinDate ? { join_date: new Date(editForm.joinDate).toISOString() } : {}),
        })
        .eq('id', editingClient.dbId)

      if (error) throw error

      setClients((prev) => prev.map((c) => {
        if (c.id !== editingClient.id) return c
        return {
          ...c,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          company: editForm.company,
          customer_type: payload.customer_type ?? c.customer_type,
          totalRevenue: Number.isFinite(incomeVal) ? `₺${Number(incomeVal).toLocaleString('tr-TR')}` : c.totalRevenue,
          notes: typeof editForm.notes === 'string' ? editForm.notes : (c.notes || undefined),
          projectStatus: editForm.projectStatus,
          joinDate: editForm.joinDate ? new Date(editForm.joinDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : c.joinDate,
          rawJoinDate: editForm.joinDate ? new Date(editForm.joinDate).toISOString() : c.rawJoinDate,
        }
      }))
      setIsEditOpen(false)
      setEditingClient(null)
    } catch (e) {
      console.error('Düzenleme hatası:', e)
      alert('Müşteri güncellenirken bir hata oluştu.')
    }
  }

  const handleCreateSave = async () => {
    const [first_name, ...rest] = createForm.name.trim().split(" ")
    const last_name = rest.join(" ") || ""

    // Zorunlu alan kontrolleri
    if (!createForm.email || !createForm.email.includes('@')) {
      alert('Lütfen geçerli bir e-posta girin.')
      return
    }

    // customer_type için güvenli normalizasyon (zorunlu)
    let normalized = (createForm.company || '').trim()
    if (normalized !== 'Bireysel' && normalized !== 'Kurumsal') {
      normalized = 'Bireysel'
    }
    const payload: any = {
      first_name,
      last_name,
      email: createForm.email,
      phone: createForm.phone,
      join_date: createForm.joinDate ? new Date(createForm.joinDate).toISOString() : new Date().toISOString(),
      status: 'Aktif',
      customer_type: normalized,
    }
    const incomeVal = parseFloat((createForm.income || '').replace(/[^0-9.\-]/g, ''))
    if (Number.isFinite(incomeVal)) payload.total_income = incomeVal
    if (typeof createForm.notes === 'string') payload.notes = createForm.notes
    if (createForm.projectStatus) payload.project_status = createForm.projectStatus

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select('*')
        .single()
      if (error) throw error

      const newClient: Client = {
        id: (clients[0]?.id ?? 0) + 1,
        dbId: data.id,
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        company: data.company || (data.customer_type || 'Bireysel'),
        customer_type: data.customer_type,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalRevenue: `₺${Number(data.total_income || 0).toLocaleString('tr-TR')}`,
        status: (data.status === 'Aktif' ? 'active' : 'inactive'),
        projectStatus: (data.project_status ?? 'ongoing') as "ongoing" | "completed" | "paused",
        joinDate: data.join_date ? new Date(data.join_date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : '',
        rawJoinDate: data.join_date,
        logo: data.logo || undefined,
        address: data.address || [data.city, data.country].filter(Boolean).join(', '),
        notes: data.notes || undefined,
      }
      setClients((prev) => [newClient, ...prev])
      setIsCreateOpen(false)
      setCreateForm({ name: "", email: "", phone: "", company: "", income: "", notes: "", projectStatus: "ongoing", joinDate: new Date().toISOString().slice(0, 10) })
    } catch (e) {
      console.error('Yeni müşteri eklenirken hata:', e)
      alert('Yeni müşteri eklenirken bir hata oluştu.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (deleteClientId == null) return

    try {
      const target = clients.find(c => c.id === deleteClientId)
      if (!target || !target.dbId) {
        alert('Silinecek kayıt bulunamadı.')
        return
      }
      const supabase = createClient()
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', target.dbId)
      if (error) throw error

      setClients(clients.filter((c) => c.id !== deleteClientId))
      setDeleteClientId(null)
    } catch (err) {
      console.error('Silme hatası:', err)
      alert('Müşteri silinirken bir hata oluştu.')
    }
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Müşteriler</h1>
              <p className="mt-2 text-muted-foreground">Tüm müşterilerinizi görüntüleyin ve yönetin</p>
            </div>
            <Button className="gap-2 w-full sm:w-auto" onClick={() => { setCreateStep(1); setIsCreateOpen(true) }}>
              <Plus className="h-4 w-4" />
              Yeni Müşteri
            </Button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Müşteri ara..." className="pl-10" />
            </div>
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              Filtrele
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard
                key={client.dbId || client.id}
                client={client}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteClientId(id)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />
      )}

      {/* Yeni Müşteri Popup */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri</DialogTitle>
            <DialogDescription>{createStep === 1 ? "Temel bilgileri girin." : "Ek bilgileri tamamlayın."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createStep === 1 ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="create-name">Ad Soyad</Label>
                  <Input id="create-name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-email">E-posta</Label>
                  <Input id="create-email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-phone">Telefon</Label>
                  <Input id="create-phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-company">Tür/Şirket (Bireysel/Kurumsal)</Label>
                  <Input id="create-company" value={createForm.company} onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-join-date">Başlangıç Tarihi</Label>
                  <Input id="create-join-date" type="date" value={createForm.joinDate} onChange={(e) => setCreateForm({ ...createForm, joinDate: e.target.value })} />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Proje Durumu</Label>
                  <Select value={createForm.projectStatus} onValueChange={(v: "ongoing" | "completed" | "paused") => setCreateForm({ ...createForm, projectStatus: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Proje durumu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                      <SelectItem value="completed">Bitti</SelectItem>
                      <SelectItem value="paused">Beklemede</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-income">Fiyat (Toplam Gelir)</Label>
                  <Input id="create-income" type="number" inputMode="decimal" value={createForm.income} onChange={(e) => setCreateForm({ ...createForm, income: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-notes">Notlar</Label>
                  <Textarea id="create-notes" rows={4} value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>İptal</Button>
            {createStep === 1 ? (
              <Button onClick={() => setCreateStep(2)}>İleri</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCreateStep(1)}>Geri</Button>
                <Button onClick={handleCreateSave}>Kaydet</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Düzenleme Popup */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteri Düzenle</DialogTitle>
            <DialogDescription>Müşteri bilgilerini güncelleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Ad Soyad</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-posta</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Tür/Şirket</Label>
              <Input id="edit-company" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-join-date">Başlangıç Tarihi</Label>
              <Input id="edit-join-date" type="date" value={editForm.joinDate} onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Proje Durumu</Label>
              <Select value={editForm.projectStatus} onValueChange={(v: "ongoing" | "completed" | "paused") => setEditForm({ ...editForm, projectStatus: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Proje durumu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                  <SelectItem value="completed">Bitti</SelectItem>
                  <SelectItem value="paused">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-income">Fiyat (Toplam Gelir)</Label>
              <Input id="edit-income" type="number" inputMode="decimal" value={editForm.income} onChange={(e) => setEditForm({ ...editForm, income: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notlar</Label>
              <Textarea id="edit-notes" rows={4} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>İptal</Button>
            <Button onClick={handleEditSave}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteClientId !== null} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}
