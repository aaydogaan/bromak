"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface Project {
  id: string
  name: string
  client: string
  description: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  budget: string
  location: string
  start_date: string
  deadline: string
  image_url: string
  payment_date?: string
  payment_amount?: string
}

interface EditProjectModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProjectModal({ project, open, onOpenChange, onSuccess }: EditProjectModalProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id'>>(project || {
    name: '',
    client: '',
    description: '',
    status: 'planning',
    budget: '',
    location: '',
    start_date: '',
    deadline: '',
    image_url: '',
    payment_date: '',
    payment_amount: ''
  })
  const [startDate, setStartDate] = useState<Date | undefined>(project?.start_date ? new Date(project.start_date) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(project?.deadline ? new Date(project.deadline) : undefined)
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(project?.payment_date ? new Date(project.payment_date) : undefined)
  const [loading, setLoading] = useState(false)

  // Proje değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        client: project.client,
        description: project.description || '',
        status: project.status,
        budget: project.budget,
        location: project.location || '',
        start_date: project.start_date,
        deadline: project.deadline,
        image_url: project.image_url || '',
        payment_date: project.payment_date || '',
        payment_amount: project.payment_amount || ''
      })
      setStartDate(project.start_date ? new Date(project.start_date) : undefined)
      setEndDate(project.deadline ? new Date(project.deadline) : undefined)
      setPaymentDate(project.payment_date ? new Date(project.payment_date) : undefined)
    }
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...formData,
          start_date: startDate?.toISOString(),
          deadline: endDate?.toISOString(),
          payment_date: paymentDate?.toISOString(),
          payment_amount: formData.payment_amount
        })
        .eq('id', project.id)

      if (error) throw error

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Proje güncellenirken hata oluştu:', error)
      alert('Proje güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Projeyi Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Proje Adı *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Müşteri *</Label>
              <Input
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: tr }) : <span>Tarih seçin (opsiyonel)</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={tr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Bütçe (₺) *</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planlamada</SelectItem>
                    <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                    <SelectItem value="on_hold">Beklemede</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasyon</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Resim URL (Opsiyonel)</Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Ödeme Bilgileri Bölümü */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Ödeme Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ödeme Tarihi</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentDate ? format(paymentDate, "PPP", { locale: tr }) : <span>Ödeme tarihi seçin</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={setPaymentDate}
                        initialFocus
                        locale={tr}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Paranın gerçekten alındığı tarih</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Ödeme Tutarı (₺)</Label>
                  <Input
                    id="payment_amount"
                    name="payment_amount"
                    type="number"
                    value={formData.payment_amount}
                    onChange={handleChange}
                    placeholder="Alınan tutar"
                  />
                  <p className="text-xs text-muted-foreground">Boş bırakılırsa bütçe kullanılır</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
