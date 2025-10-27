"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UIEventMini {
  id: string
  title: string
  happenedAt: string
}

function timeAgo(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return "az önce"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} dakika önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} saat önce`
  const day = Math.floor(hr / 24)
  return `${day} gün önce`
}

export function RecentActivity() {
  const [items, setItems] = useState<UIEventMini[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('events')
          .select('id, title, happened_at')
          .order('happened_at', { ascending: false })
          .limit(5)
        if (error) throw error
        setItems((data || []).map((e: any) => ({ id: String(e.id), title: e.title, happenedAt: e.happened_at })))
      } catch (e) {
        console.error('Son olaylar yüklenirken hata:', e)
      }
    }
    fetchEvents()
  }, [])

  return (
    <Card className="glass-effect p-6">
      <h3 className="text-lg font-semibold text-foreground">Son Olaylar</h3>
      <div className="mt-6 space-y-4">
        {items.map((ev) => (
          <div key={ev.id} className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-primary text-sm font-semibold">E</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-2">{ev.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(ev.happenedAt)}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Gösterilecek olay yok.</p>
        )}
      </div>
    </Card>
  )
}
