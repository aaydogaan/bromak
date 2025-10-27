"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: (row: any) => void
}

export function AddNoteModal({ isOpen, onClose, onAdded }: AddNoteModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !category || !priority) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content,
          category,      // DB enum values ile birebir: 'toplantı','fikir','Görev','Fİnans','Geneli Eğlence'
          priority,      // 'düşük','Orta','yüksek'
        })
        .select('*')
        .single()
      if (error) throw error
      // Reset and notify
      setTitle("")
      setContent("")
      setCategory("")
      setPriority("")
      onClose()
      onAdded?.(data)
    } catch (err) {
      console.error('Not eklenirken hata:', err)
      alert('Not eklenirken bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Yeni Not Ekle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Not Başlığı *</Label>
            <Input
              id="title"
              placeholder="Örn: Toplantı Notları"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toplantı">toplantı</SelectItem>
                <SelectItem value="fikir">fikir</SelectItem>
                <SelectItem value="Görev">Görev</SelectItem>
                <SelectItem value="Finans">Finans</SelectItem>
                <SelectItem value="Eğlence">Eğlence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik *</Label>
            <Select value={priority} onValueChange={setPriority} required>
              <SelectTrigger>
                <SelectValue placeholder="Öncelik seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="düşük">düşük</SelectItem>
                <SelectItem value="Orta">Orta</SelectItem>
                <SelectItem value="yüksek">yüksek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Not İçeriği *</Label>
            <Textarea
              id="content"
              placeholder="Not içeriğini buraya yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={submitting}>
              İptal
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              Not Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
