"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, Banknote, Calendar, Building2, MapPin } from "lucide-react"
import { Separator } from "@/components/ui/separator"

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

interface ClientDetailsModalProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailsModal({ client, open, onOpenChange }: ClientDetailsModalProps) {
  if (!client) return null

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-border/50 bg-background/95 backdrop-blur-xl sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Müşteri Detayları</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              {client.logo ? (
                <AvatarImage src={client.logo || "/placeholder.svg"} alt={client.name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-semibold">{client.name}</h3>
              <p className="text-muted-foreground">{client.company}</p>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                  {client.status === "active" ? "Aktif Müşteri" : "Pasif Müşteri"}
                </Badge>
                {getProjectStatusBadge(client.projectStatus)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold">İletişim Bilgileri</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{client.company}</span>
              </div>
              {client.address && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{client.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Katılım: {client.joinDate}</span>
              </div>
            </div>
          </div>

          

          {/* Revenue Information */}
          <div className="space-y-3">
            <h4 className="font-semibold">Gelir Bilgisi</h4>
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Banknote className="h-4 w-4" />
                  <span>Toplam Gelir</span>
                </div>
                <p className="text-2xl font-semibold text-primary">{client.totalRevenue}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Notlar</h4>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
