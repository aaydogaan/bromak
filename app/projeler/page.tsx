"use client"

import { PageWrapper } from "@/components/page-wrapper"
import { ProjectCard } from "@/components/project-card"
import { ProjectDetailsModal } from "@/components/project-details-modal"
import { EditProjectModal } from "@/components/edit-project-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Calendar } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

// Veritabanından gelen proje tipi
interface ProjectFromDB {
  id: string
  name: string
  description: string
  client: string
  status: ProjectStatus
  budget: string
  deadline: string
  start_date: string
  location: string
  image_url: string
  created_at?: string
}

// Bileşenlerde kullanılacak proje tipi
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

// Proje kartı için gerekli özellikler
interface ProjectCardProps {
  project: {
    id: string
    name: string
    client: string
    status: 'active' | 'planning' | 'completed'
    budget: string
    deadline: string
    image: string
    description: string
    location: string
    startDate: string
  }
  onClick: () => void
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectFromDB[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectFromDB[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'deadline' | 'budget' | 'start_date'>('deadline')
  const [monthFilter, setMonthFilter] = useState<string>("all")

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setProjects(data || [])
        setFilteredProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Generate last 12 months for filter
  const monthOptions = useMemo(() => {
    const options = [{ value: "all", label: "Tüm Aylar" }]
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })
      options.push({ value: key, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }
    return options
  }, [])

  useEffect(() => {
    let filtered = projects

    // Search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Month filter (based on payment_date or start_date)
    if (monthFilter !== "all") {
      filtered = filtered.filter(project => {
        const dateStr = (project as any).payment_date || project.start_date
        if (!dateStr) return false
        const d = new Date(dateStr)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        return key === monthFilter
      })
    }

    setFilteredProjects(filtered)
  }, [searchQuery, monthFilter, projects])

  // Robust budget parser (handles TL strings and commas)
  const parseBudget = (val?: string): number => {
    const raw = (val || '').trim()
    if (!raw) return 0
    const cleaned = raw.replace(/[^0-9.,]/g, '')
    
    // Hem nokta hem virgül varsa (örn: 25.077,45)
    if (cleaned.includes('.') && cleaned.includes(',')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.')
      return parseFloat(normalized) || 0
    }
    
    // Sadece virgül varsa (örn: 25077,45)
    if (cleaned.includes(',')) {
      const normalized = cleaned.replace(',', '.')
      return parseFloat(normalized) || 0
    }
    
    // Sadece nokta varsa (örn: 25077.45 veya 17.500)
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.')
      const lastPart = parts[parts.length - 1]
      if (lastPart.length === 3) {
        const normalized = cleaned.replace(/\./g, '')
        return parseFloat(normalized) || 0
      } else {
        return parseFloat(cleaned) || 0
      }
    }
    
    return parseFloat(cleaned) || 0
  }

  // Sorted list derived from filteredProjects
  const sortedProjects = useMemo(() => {
    const arr = [...filteredProjects]
    if (sortBy === 'deadline') {
      arr.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : 0
        const db = b.deadline ? new Date(b.deadline).getTime() : 0
        return db - da // newest/end-date last first
      })
    } else if (sortBy === 'budget') {
      arr.sort((a, b) => parseBudget(b.budget) - parseBudget(a.budget))
    } else if (sortBy === 'start_date') {
      arr.sort((a, b) => {
        const sa = a.start_date ? new Date(a.start_date).getTime() : 0
        const sb = b.start_date ? new Date(b.start_date).getTime() : 0
        return sb - sa
      })
    }
    return arr
  }, [filteredProjects, sortBy])

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    // Projeleri yeniden yükle
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setProjects(data || [])
        setFilteredProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      // Remove the deleted project from the state
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Projeler</h1>
              <p className="mt-2 text-muted-foreground">Tüm aktif ve tamamlanmış projelerin listesi</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Proje, müşteri veya konu ara..."
                  className="w-full pl-9 sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm flex items-center gap-2"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  aria-label="Ay Filtresi"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'deadline' | 'budget' | 'start_date')}
                  aria-label="Sırala"
                >
                  <option value="deadline">Bitiş Tarihine Göre (Yeni→Eski)</option>
                  <option value="budget">Bütçeye Göre (Yüksek→Düşük)</option>
                  <option value="start_date">Başlangıç Tarihine Göre (Yeni→Eski)</option>
                </select>
              </div>
              <Link href="/projeler/yeni">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Proje
                </Button>
              </Link>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Aramanızla eşleşen proje bulunamadı.'
                  : 'Henüz proje eklenmemiş.'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setSearchQuery('')}
                >
                  Filtreyi temizle
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => {
                // Veritabanından gelen projeyi bileşenin beklediği forma dönüştürüyoruz
                const formattedProject: Project = {
                  ...project,
                  image: project.image_url || '/placeholder.svg',
                  startDate: project.start_date,
                  created_at: project.created_at || new Date().toISOString(),
                  start_date: project.start_date || '',
                  image_url: project.image_url || '/placeholder.svg',
                  description: project.description || '',
                  location: project.location || ''
                }

                return (
                  <div key={project.id} className="h-full">
                    <ProjectCard
                      project={{
                        ...formattedProject,
                        status: formattedProject.status as 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
                        image: formattedProject.image || '/placeholder.svg'
                      }}
                      onViewDetails={() => {
                        setSelectedProject(formattedProject)
                        setIsModalOpen(true)
                      }}
                      onEdit={() => handleEdit(formattedProject)}
                      onDelete={() => handleDelete(project.id)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <ProjectDetailsModal
        project={selectedProject}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </PageWrapper>
  )
}
