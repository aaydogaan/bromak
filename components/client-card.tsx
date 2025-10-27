"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, FolderKanban, Banknote, Calendar, Pencil, Trash2 } from "lucide-react"

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalRevenue: string
  status: "active" | "inactive"
  projectStatus: "ongoing" | "completed" | "paused"
  joinDate: string
  logo?: string
  address?: string
  notes?: string
}

interface ClientCardProps {
  client: Client
  onViewDetails: (client: Client) => void
  onEdit: (client: Client) => void
  onDelete: (clientId: number) => void
}

export function ClientCard({ client, onViewDetails, onEdit, onDelete }: ClientCardProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case "ongoing":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Devam Ediyor</Badge>
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Bitti</Badge>
      case "paused":
        return <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">Beklemede</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {client.logo ? (
                <AvatarImage src={client.logo || "/placeholder.svg"} alt={client.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-semibold leading-none">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.company}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={client.status === "active" ? "default" : "secondary"}>
              {client.status === "active" ? "Aktif" : "Pasif"}
            </Badge>
            {getProjectStatusBadge(client.projectStatus)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{client.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Katılım: {client.joinDate}</span>
          </div>
        </div>

        {/* Proje İstatistikleri kaldırıldı */}

        <div className="rounded-lg bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <span>Toplam Gelir</span>
            </div>
            <p className="text-lg font-semibold text-primary">{client.totalRevenue}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onViewDetails(client)}>
            Detayları Görüntüle
          </Button>
          <Button variant="outline" size="icon" className="bg-transparent" onClick={() => onEdit(client)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-transparent text-destructive hover:text-destructive"
            onClick={() => onDelete(client.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
