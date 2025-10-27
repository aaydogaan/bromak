import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Phone } from "lucide-react"
import { ProfilePopup } from "./profile-popup"

export interface TeamMember {
  id: string
  // Original database fields
  first_name: string
  last_name: string
  position: string
  email: string
  phone: string
  profile_image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Social Media Links
  linkedin_url?: string
  twitter_url?: string
  instagram_url?: string
  website_url?: string
  
  // Additional fields for the card component
  name?: string
  role?: string
  avatar?: string
  status?: 'active' | 'away'
  activeProjects?: number
  completedProjects?: number
}

interface TeamMemberCardProps {
  member: TeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [showProfile, setShowProfile] = useState(false)
  const fullName = `${member.first_name} ${member.last_name}`
  const initials = `${member.first_name[0]}${member.last_name[0]}`
  
  const toggleProfile = () => setShowProfile(!showProfile)

  return (
    <Card className="glass-effect h-full flex flex-col">
      <CardHeader className="text-center flex-1">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage 
              src={member.avatar || member.profile_image_url || "/placeholder.svg"} 
              alt={fullName} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{member.name || fullName}</h3>
            <p className="text-sm text-muted-foreground">{member.role || member.position}</p>
            <div className="flex items-center justify-center gap-1">
              <div className={`h-2 w-2 rounded-full ${
                member.status === 'active' || member.is_active ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-xs text-muted-foreground">
                {member.status === 'active' || member.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-center">
          <div className="flex flex-col items-center justify-center gap-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a 
                href={`mailto:${member.email}`} 
                className="hover:text-primary transition-colors"
              >
                {member.email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {member.phone ? (
                <a 
                  href={`tel:${member.phone.replace(/\D/g, '')}"`} 
                  className="hover:text-primary transition-colors"
                >
                  {member.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">Belirtilmemiş</span>
              )}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full bg-transparent hover:bg-primary/5"
          onClick={toggleProfile}
        >
          Profili Görüntüle
        </Button>
        
        {showProfile && (
          <ProfilePopup 
            member={member} 
            onClose={toggleProfile} 
          />
        )}
      </CardContent>
    </Card>
  )
}
