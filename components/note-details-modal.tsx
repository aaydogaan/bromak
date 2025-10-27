"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Tag } from "lucide-react"

interface Note {
  id: number
  title: string
  content: string
  date: string
  category: string
  color: string
}

interface NoteDetailsModalProps {
  note: Note
  isOpen: boolean
  onClose: () => void
}

export function NoteDetailsModal({ note, isOpen, onClose }: NoteDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">{note.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(note.date).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {note.category}
              </span>
            </div>
          </div>

          <div className={`rounded-lg bg-gradient-to-r ${note.color} p-4`}>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Not İçeriği</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{note.content}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
