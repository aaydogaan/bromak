"use client"

import { PageWrapper } from "@/components/page-wrapper"
import { Button } from "@/components/ui/button"
import { Plus, Search, Trash2, CheckCircle, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NoteCard } from "@/components/note-card"
import { useEffect, useState } from "react"
import { AddNoteModal } from "@/components/add-note-modal"
import { createClient } from "@/lib/supabase/client"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Priority = 'düşük' | 'Orta' | 'yüksek'

type EventStatus = 'planned' | 'in_progress' | 'done'
type EventCategory = 'sosyal_medya' | 'domain' | 'genel' | 'finans' | 'görev'

interface UINote {
  id: number
  dbId: string
  title: string
  content: string
  date: string
  category: string
  color: string
}

interface UIEvent {
  dbId: string
  title: string
  description: string | null
  category: EventCategory
  status: EventStatus
  happenedAt: string
}

export default function NotlarPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [notes, setNotes] = useState<UINote[]>([])
  const [loading, setLoading] = useState(true)
  const [noteToDelete, setNoteToDelete] = useState<UINote | null>(null)
  const [events, setEvents] = useState<UIEvent[]>([])
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [isAllEventsOpen, setIsAllEventsOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<UIEvent | null>(null)
  const [eventToView, setEventToView] = useState<UIEvent | null>(null)
  const [eventForm, setEventForm] = useState<{ title: string; description: string; category: EventCategory; status: EventStatus; happenedAt: string }>({
    title: "",
    description: "",
    category: 'genel',
    status: 'planned',
    happenedAt: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const colorByPriority = (priority: Priority | null | undefined): string => {
          switch (priority) {
            case 'düşük':
              return 'from-green-500/20 to-emerald-500/20'
            case 'Orta':
              return 'from-orange-500/20 to-amber-500/20'
            case 'yüksek':
              return 'from-red-500/20 to-rose-500/20'
            default:
              return 'from-slate-500/20 to-gray-500/20'
          }

  const toggleEventDone = async (ev: UIEvent) => {
    try {
      const supabase = createClient()
      const next: EventStatus = ev.status === 'done' ? 'planned' : 'done'
      const { error } = await supabase
        .from('events')
        .update({ status: next })
        .eq('id', ev.dbId)
      if (error) throw error
      setEvents((prev) => prev.map(e => e.dbId === ev.dbId ? { ...e, status: next } : e))
      setEventToView((prev) => (prev && prev.dbId === ev.dbId ? { ...prev, status: next } : prev))
    } catch (e) {
      console.error('Olay güncellenirken hata:', e)
      alert('Durum güncellenemedi.')
    }
  }
        }

        const formatted: UINote[] = (data || []).map((n: any, idx: number) => ({
          id: idx + 1,
          dbId: String(n.id),
          title: n.title,
          content: n.content,
          date: n.created_at,
          category: n.category,
          color: colorByPriority(n.priority as Priority),
        }))

        setNotes(formatted)
      } catch (e) {
        console.error('Notlar yüklenirken hata:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('happened_at', { ascending: false })
        if (error) throw error
        const formatted: UIEvent[] = (data || []).map((e: any) => ({
          dbId: String(e.id),
          title: e.title,
          description: e.description,
          category: e.category as EventCategory,
          status: e.status as EventStatus,
          happenedAt: e.happened_at,
        }))
        setEvents(formatted)
      } catch (e) {
        console.error('Olaylar yüklenirken hata:', e)
      }
    }
    fetchEvents()
  }, [])

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDeleteNote = async (note: UINote) => {
    if (!note.dbId) return
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.dbId)
      if (error) throw error
      setNotes((prev) => prev.filter((n) => n.dbId !== note.dbId))
      setNoteToDelete(null)
    } catch (e) {
      console.error('Not silinirken hata:', e)
      alert('Not silinirken bir hata oluştu.')
    }
  }

  const handleDeleteEvent = async (ev: UIEvent) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', ev.dbId)
      if (error) throw error
      setEvents((prev) => prev.filter((e) => e.dbId !== ev.dbId))
      setEventToDelete(null)
    } catch (e) {
      console.error('Olay silinirken hata:', e)
      alert('Olay silinirken bir hata oluştu.')
    }
  }

  const toggleEventDone = async (ev: UIEvent) => {
    try {
      const supabase = createClient()
      const next: EventStatus = ev.status === 'done' ? 'planned' : 'done'
      const { error } = await supabase
        .from('events')
        .update({ status: next })
        .eq('id', ev.dbId)
      if (error) throw error
      setEvents((prev) => prev.map((e) => (e.dbId === ev.dbId ? { ...e, status: next } : e)))
      setEventToView((prev) => (prev && prev.dbId === ev.dbId ? { ...prev, status: next } : prev))
    } catch (e) {
      console.error('Olay güncellenirken hata:', e)
      alert('Durum güncellenemedi.')
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notlar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tüm notlarınızı görüntüleyin ve yönetin</p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={() => setIsAddEventOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Olay Ekle
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Not Ekle
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Not ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

      {/* Yeni Olay Popup */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Olay Ekle</DialogTitle>
            <DialogDescription>Olay bilgilerini girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ev-title">Başlık</Label>
              <Input id="ev-title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-desc">Açıklama</Label>
              <Textarea id="ev-desc" rows={4} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={eventForm.category} onValueChange={(v: EventCategory) => setEventForm({ ...eventForm, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sosyal_medya">sosyal_medya</SelectItem>
                  <SelectItem value="domain">domain</SelectItem>
                  <SelectItem value="genel">genel</SelectItem>
                  <SelectItem value="finans">finans</SelectItem>
                  <SelectItem value="görev">görev</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Durum</Label>
              <Select value={eventForm.status} onValueChange={(v: EventStatus) => setEventForm({ ...eventForm, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">planned</SelectItem>
                  <SelectItem value="in_progress">in_progress</SelectItem>
                  <SelectItem value="done">done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-date">Tarih/Saat</Label>
              <Input id="ev-date" type="datetime-local" value={eventForm.happenedAt} onChange={(e) => setEventForm({ ...eventForm, happenedAt: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>İptal</Button>
            <Button onClick={async () => {
              try {
                const supabase = createClient()
                const payload: any = {
                  title: eventForm.title,
                  description: eventForm.description || null,
                  category: eventForm.category,
                  status: eventForm.status,
                  happened_at: new Date(eventForm.happenedAt).toISOString(),
                }
                const { data, error } = await supabase
                  .from('events')
                  .insert(payload)
                  .select('*')
                  .single()
                if (error) throw error
                const ui: UIEvent = {
                  dbId: String(data.id),
                  title: data.title,
                  description: data.description,
                  category: data.category as EventCategory,
                  status: data.status as EventStatus,
                  happenedAt: data.happened_at,
                }
                setEvents((prev) => [ui, ...prev])
                setIsAddEventOpen(false)
                setEventForm({ title: "", description: "", category: 'genel', status: 'planned', happenedAt: new Date().toISOString().slice(0, 16) })
              } catch (e) {
                console.error('Olay eklenirken hata:', e)
                alert('Olay eklenirken bir hata oluştu.')
              }
            }}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Olay Detayı Popup */}
      <Dialog open={!!eventToView} onOpenChange={() => setEventToView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {eventToView?.status === 'done' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              {eventToView?.title}
            </DialogTitle>
            <DialogDescription>
              {eventToView ? new Date(eventToView.happenedAt).toLocaleString('tr-TR') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {eventToView?.description && (
              <p className="text-sm text-foreground whitespace-pre-wrap">{eventToView.description}</p>
            )}
            <div className="text-xs text-muted-foreground">Kategori: {eventToView?.category}</div>
            <div className="text-xs text-muted-foreground">Durum: {eventToView?.status}</div>
          </div>
          <DialogFooter>
            {!!eventToView && (
              <>
                <Button variant="outline" onClick={() => setEventToView(null)}>Kapat</Button>
                <Button onClick={() => toggleEventDone(eventToView)}>
                  {eventToView.status === 'done' ? 'Yapılmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/* İki sütun: Sol Olaylar, Sağ Notlar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sol: Olaylar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Olaylar</h2>
            <div className="space-y-3">
              {events.slice(0, 5).map((ev) => (
                <div
                  key={ev.dbId}
                  className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setEventToView(ev)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{ev.title}</p>
                      {ev.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded p-1 hover:bg-accent/50"
                        aria-label={ev.status === 'done' ? 'Yapılmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                        onClick={(e) => { e.stopPropagation(); toggleEventDone(ev) }}
                      >
                        {ev.status === 'done' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ev.happenedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 bg-transparent border-destructive/30"
                        onClick={(e) => { e.stopPropagation(); setEventToDelete(ev) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-sm text-muted-foreground">Henüz olay eklenmemiş.</div>
              )}
              {events.length > 5 && (
                <div className="pt-2">
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsAllEventsOpen(true)}>
                    Tümünü Gör
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sağ: Notlar */}
          <div className="lg:col-span-2">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {filteredNotes.map((note) => (
                <NoteCard key={note.dbId} note={note} onDelete={(n) => setNoteToDelete(n as any)} />
              ))}
            </div>
            {!loading && filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">Not bulunamadı</p>
                <p className="mt-2 text-sm text-muted-foreground">Arama kriterlerinizi değiştirmeyi deneyin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tüm Olaylar Popup */}
      <Dialog open={isAllEventsOpen} onOpenChange={setIsAllEventsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tüm Olaylar</DialogTitle>
            <DialogDescription>Kaydedilmiş tüm olayların listesi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
            {events.map((ev) => (
              <div key={ev.dbId} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground break-words">{ev.title}</p>
                    {ev.description && (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground break-words">
                      {new Date(ev.happenedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 bg-transparent border-destructive/30"
                      onClick={() => setEventToDelete(ev)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-sm text-muted-foreground">Henüz olay eklenmemiş.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllEventsOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Silme Onayı */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {noteToDelete?.title ? `"${noteToDelete.title}" notunu silmek istediğinizden emin misiniz?` : 'Bu notu silmek istediğinizden emin misiniz?'} Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => noteToDelete && handleDeleteNote(noteToDelete)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Olay Silme Onayı */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Olayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete?.title ? `"${eventToDelete.title}" olayını silmek istediğinizden emin misiniz?` : 'Bu olayı silmek istediğinizden emin misiniz?'} Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => eventToDelete && handleDeleteEvent(eventToDelete)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddNoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(row: any) => {
          const colorByPriority = (priority: Priority | null | undefined): string => {
            switch (priority) {
              case 'düşük':
                return 'from-green-500/20 to-emerald-500/20'
              case 'Orta':
                return 'from-orange-500/20 to-amber-500/20'
              case 'yüksek':
                return 'from-red-500/20 to-rose-500/20'
              default:
                return 'from-slate-500/20 to-gray-500/20'
            }
          }
          const ui: UINote = {
            id: (notes[0]?.id ?? 0) + 1,
            dbId: String(row.id),
            title: row.title,
            content: row.content,
            date: row.created_at,
            category: row.category,
            color: colorByPriority(row.priority as Priority),
          }
          setNotes((prev) => [ui, ...prev])
        }}
      />
    </PageWrapper>
  )
}
