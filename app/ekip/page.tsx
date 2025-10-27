"use client"

import { useEffect, useState } from "react"
import { TeamMemberCard, TeamMember } from "@/components/team-member-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { PageWrapper } from "@/components/page-wrapper"
import { createClient } from "@/lib/supabase/client"

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [messageType, setMessageType] = useState<'no-members' | 'no-results' | null>(null)

  // Ekip üyesi ekle butonuna tıklandığında çalışacak fonksiyon
  const handleAddMemberClick = () => {
    setMessageType('no-members')
    setShowMessage(true)
    
    // 5 saniye sonra mesajı otomatik kapat
    setTimeout(() => {
      setShowMessage(false)
    }, 5000)
  }

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Map the data to match the expected format for TeamMemberCard
        const formattedData = data.map(member => ({
          ...member,
          name: `${member.first_name} ${member.last_name}`,
          role: member.position,
          avatar: member.profile_image_url || "/placeholder.svg?height=100&width=100",
          status: member.is_active ? "active" : "away",
          activeProjects: 0, // These would need to be fetched from the database
          completedProjects: 0 // These would need to be fetched from the database
        }))
        
        setTeamMembers(formattedData || [])
      } catch (error) {
        console.error('Ekip üyeleri yüklenirken hata oluştu:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  // Arama sonuçlarını filtrele
  const filteredMembers = teamMembers.filter(member => {
    // Eğer arama terimi yoksa tüm üyeleri göster
    if (!searchTerm.trim()) return true
    
    // Üye adı ve soyadını birleştir
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const position = member.position?.toLowerCase() || ''
    const email = member.email?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    
    // Arama terimini ad, soyad, pozisyon veya e-posta adresinde ara
    return (
      fullName.includes(search) ||
      position.includes(search) ||
      email.includes(search)
    )
  })

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ekip</h1>
              <p className="mt-2 text-muted-foreground">Ekip üyelerinizi görüntüleyin ve yönetin</p>
            </div>
            <Button 
              className="gap-2"
              onClick={handleAddMemberClick}
            >
              <Plus className="h-4 w-4" />
              Ekip Üyesi Ekle
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Ekip üyesi ara..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filtrele</Button>
          </div>

          {/* Ekip üyesi ekleme mesajı */}
          {showMessage && messageType === 'no-members' && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
                <p className="text-base text-center text-gray-800 dark:text-gray-200 leading-relaxed">
                  Ekip zaten üç kişi ve kendi işimizi gayet iyi yapıyoruz. 
                  <span className="block mt-2 font-medium">Biz yeterli değil miyiz, Hayırdır?</span>
                </p>
              </div>
            </div>
          )}

          {/* Arama sonucu yoksa gösterilecek mesaj */}
          {filteredMembers.length === 0 && searchTerm && !showMessage && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Aradığınız kriterlere uygun ekip üyesi bulunamadı.
              </p>
            </div>
          )}

          {/* Ekip üyelerini gösterme */}
          {filteredMembers.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
