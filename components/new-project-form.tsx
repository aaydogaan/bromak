"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

export function NewProjectForm() {
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    status: 'planning' as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
    project_type: 'web_site' as 'web_site' | 'sosyal_medya' | 'diger',
    budget: '',
    location: '',
    start_date: '',
    deadline: '',
    image_url: '',
    payment_date: '',
    payment_amount: ''
  })
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [paymentDate, setPaymentDate] = useState<Date>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Zorunlu alanları kontrol et
      if (!formData.name || !formData.client || !startDate) {
        throw new Error('Lütfen tüm zorunlu alanları doldurunuz.')
      }

      const projectData = {
        name: formData.name,
        client: formData.client,
        description: formData.description,
        status: formData.status,
        project_type: formData.project_type,
        budget: formData.budget || '0', // Boş bırakılırsa 0 olarak ayarla
        location: formData.location || '',
        start_date: startDate.toISOString(),
        deadline: endDate?.toISOString() || null,
        image_url: formData.image_url || null,
        payment_date: paymentDate?.toISOString() || null,
        payment_amount: formData.payment_amount || formData.budget,
        created_at: new Date().toISOString()
      }

      console.log('Gönderilen veri:', projectData)

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()

      console.log('Supabase yanıtı:', { data, error })

      if (error) {
        console.error('Supabase hatası:', error)
        throw new Error(error.message || 'Veritabanına kayıt sırasında bir hata oluştu')
      }

      if (!data) {
        throw new Error('Veri kaydedilemedi. Lütfen tekrar deneyin.')
      }

      // Send email notification
      try {
        const statusMap = {
          'planning': 'Planlama',
          'in_progress': 'Devam Ediyor',
          'on_hold': 'Beklemede',
          'completed': 'Tamamlandı',
          'cancelled': 'İptal Edildi'
        }

        await fetch('/api/email/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            customer_name: formData.client,
            status: statusMap[formData.status] || formData.status,
            total_amount: parseFloat(formData.budget) || 0,
          }),
        })
      } catch (emailError) {
        console.error('Email notification error:', emailError)
        // Don't block the main flow if email fails
      }

      // Başarılı olduğunda projeler sayfasına yönlendir
      window.location.href = '/projeler'
    } catch (error) {
      console.error('Proje oluşturulurken hata oluştu:', error)
      alert(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'}`)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Proje Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Proje Adı *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Örn: Turkish Airlines"
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
                placeholder="Müşteri adı girin"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Proje Açıklaması</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Proje hakkında detaylı bilgi girin..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lokasyon</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Projenin konumunu girin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Durum *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value as any)}
            >
              <SelectTrigger id="status">
                <SelectValue />
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

          <div className="space-y-2">
            <Label htmlFor="project_type">Proje Türü *</Label>
            <Select
              value={formData.project_type}
              onValueChange={(value) => handleSelectChange('project_type', value as any)}
            >
              <SelectTrigger id="project_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web_site">Web Sitesi</SelectItem>
                <SelectItem value="sosyal_medya">Sosyal Medya</SelectItem>
                <SelectItem value="diger">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Bütçe ve Tarih</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Bütçe (₺) *</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="45000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Resim URL (Opsiyonel)</Label>
              <Input
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="Firma Logosu"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: tr }) : "Tarih seçin (opsiyonel)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Ödeme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ödeme Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent",
                      !paymentDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP", { locale: tr }) : "Ödeme tarihi seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus />
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Projeyi Oluştur'}
        </Button>
      </div>
    </form>
  )
}
