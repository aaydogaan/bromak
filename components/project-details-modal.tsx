"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Banknote, User, MapPin, FileText } from "lucide-react"
import Image from "next/image"
import { format, parseISO } from "date-fns"
import { tr } from "date-fns/locale"

// Tarih formatlama fonksiyonu
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'd MMMM yyyy', { locale: tr })
  } catch (error) {
    return dateString // Eğer tarih formatı geçersizse orijinal değeri döndür
  }
}

interface Project {
  id: string
  name: string
  client: string
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  budget: string
  deadline: string
  image: string
  description: string
  location: string
  created_at: string
  image_url: string
  start_date: string
  startDate?: string
}

interface ProjectDetailsModalProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  planning: { label: "Planlamada", variant: "secondary" as const },
  in_progress: { label: "Devam Ediyor", variant: "default" as const },
  on_hold: { label: "Beklemede", variant: "secondary" as const },
  completed: { label: "Tamamlandı", variant: "outline" as const },
  cancelled: { label: "İptal Edildi", variant: "destructive" as const }
}

export function ProjectDetailsModal({ project, open, onOpenChange }: ProjectDetailsModalProps) {
  if (!project) return null

  const status = statusConfig[project.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Image */}
          <div className="relative h-64 w-full overflow-hidden rounded-lg">
            <Image src={project.image || "/placeholder.svg"} alt={project.name} fill className="object-cover" />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Durum:</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {/* Project Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-4">
              <User className="mt-0.5 h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Müşteri</p>
                <p className="mt-1 font-semibold">{project.client}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 p-4">
              <Banknote className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Bütçe</p>
                <p className="mt-1 text-lg font-bold text-amber-900">{project.budget} ₺</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
              <Calendar className="mt-0.5 h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Başlangıç</p>
                <p className="mt-1 font-semibold">{project.startDate ? formatDate(project.startDate) : 'Belirtilmemiş'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-orange-50 p-4">
              <Calendar className="mt-0.5 h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bitiş Tarihi</p>
                <p className="mt-1 font-semibold">{formatDate(project.deadline)}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {project.location && (
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Konum</p>
                <p className="mt-1 font-semibold">{project.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Proje Açıklaması</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{project.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
