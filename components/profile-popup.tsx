import { Button } from "./ui/button"
import { TeamMember } from "./team-member-card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Mail, Phone, Linkedin, X, Instagram, Globe } from "lucide-react"

interface ProfilePopupProps {
  member: TeamMember
  onClose: () => void
}

export function ProfilePopup({ member, onClose }: ProfilePopupProps) {
  const fullName = `${member.first_name} ${member.last_name}`
  const initials = `${member.first_name[0]}${member.last_name[0]}`

  // Social media links from team member data
  const socialLinks = [
    { 
      name: 'LinkedIn', 
      icon: <Linkedin className="h-5 w-5" />, 
      url: member.linkedin_url,
      color: 'hover:text-[#0077b5]',
      key: 'linkedin_url'
    },
    { 
      name: 'Twitter', 
      icon: <X className="h-5 w-5" />, 
      url: member.twitter_url,
      color: 'hover:text-[#1DA1F2]',
      key: 'twitter_url'
    },
    { 
      name: 'Instagram', 
      icon: <Instagram className="h-5 w-5" />, 
      url: member.instagram_url,
      color: 'hover:text-[#E1306C]',
      key: 'instagram_url'
    },
    { 
      name: 'Website', 
      icon: <Globe className="h-5 w-5" />, 
      url: member.website_url,
      color: 'hover:text-primary',
      key: 'website_url'
    },
  ].filter(link => link.url) // Only show social links that have a URL

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Kapat"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-primary/20 mb-4">
              <AvatarImage 
                src={member.avatar || member.profile_image_url || "/placeholder.svg"} 
                alt={fullName} 
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{fullName}</h2>
            <p className="text-muted-foreground">{member.position}</p>
            <div className="flex items-center gap-1 mt-2">
              <div className={`h-2 w-2 rounded-full ${
                member.is_active ? 'bg-green-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-muted-foreground">
                {member.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-lg">İletişim Bilgileri</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a 
                  href={`mailto:${member.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {member.email}
                </a>
              </div>
              
              {member.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a 
                    href={`tel:${member.phone.replace(/\D/g, '')}`}
                    className="hover:text-primary transition-colors"
                  >
                    {member.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-3">
            <h3 className="font-medium text-lg">Sosyal Medya</h3>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.key}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${social.color}`}
                >
                  {social.icon}
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button 
            onClick={onClose}
            className="w-full"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )
}
