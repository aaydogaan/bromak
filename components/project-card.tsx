"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Banknote, User, Eye, Trash2 } from "lucide-react"
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
  // Aşağıdaki alanlar opsiyonel
  startDate?: string
  project_type?: 'web_site' | 'sosyal_medya' | 'diger'
}

interface ProjectCardProps {
  project: Project
  onViewDetails: (project: Project) => void
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

const statusConfig = {
  planning: { label: "Planlamada", variant: "secondary" as const },
  in_progress: { label: "Devam Ediyor", variant: "default" as const },
  on_hold: { label: "Beklemede", variant: "secondary" as const },
  completed: { label: "Tamamlandı", variant: "outline" as const },
  cancelled: { label: "İptal Edildi", variant: "destructive" as const }
}

export function ProjectCard({ 
  project, 
  onViewDetails = () => {}, 
  onEdit = () => {}, 
  onDelete = () => {},
  onClick 
}: ProjectCardProps & { onClick?: () => void }) {
  const status = statusConfig[project.status]

  const typeLabel = (() => {
    switch (project.project_type) {
      case 'web_site': return 'Web Sitesi'
      case 'sosyal_medya': return 'Sosyal Medya'
      case 'diger': return 'Diğer'
      default: return null
    }
  })()

  return (
    <Card className="glass-effect overflow-hidden transition-all hover:shadow-lg">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={project.image || "/placeholder.svg"}
          alt={project.name}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-balance font-semibold leading-tight">{project.name}</h3>
          <div className="flex items-center gap-2">
            {typeLabel && (
              <Badge variant="secondary" className="bg-indigo-500/15 text-indigo-600 hover:bg-indigo-500/20">
                {typeLabel}
              </Badge>
            )}
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{project.client}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{project.startDate ? formatDate(project.startDate) : 'Belirtilmemiş'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 flex-shrink-0 text-amber-500" />
            <span className="font-medium text-foreground">{project.budget} ₺</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1" 
          onClick={(e) => {
            e.stopPropagation();
            onClick ? onClick() : onViewDetails(project);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          Detaylar
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
          Düzenle
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(project.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      </CardContent>
    </Card>
  )
}
