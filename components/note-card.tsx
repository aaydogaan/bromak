"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Calendar } from "lucide-react"
import { useState } from "react"
import { NoteDetailsModal } from "./note-details-modal"

interface Note {
  id: number
  dbId: string
  title: string
  content: string
  date: string
  category: string
  color: string
}

interface NoteCardProps {
  note: Note
  onDelete?: (note: Note) => Promise<void> | void
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleDelete = () => {
    onDelete?.(note)
  }

  return (
    <>
      <Card className={`glass-effect overflow-hidden transition-all hover:shadow-lg`}>
        <div className={`h-2 bg-gradient-to-r ${note.color}`} />
        <div className="p-6">
          <div className="mb-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground line-clamp-2">{note.title}</h3>
            </div>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {note.category}
            </span>
          </div>

          <p className="mb-4 text-sm text-muted-foreground line-clamp-3">{note.content}</p>

          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(note.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              Detayları Gör
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <NoteDetailsModal note={note} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
    </>
  )
}
