"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { useMoneyVisibility } from "@/components/money-visibility"
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users,
  FileText,
  UserCircle,
  Plus,
  X,
  StickyNote,
} from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { href: "/", icon: LayoutDashboard, label: "Ana Sayfa" },
  { href: "/projeler", icon: FolderKanban, label: "Projeler" },
  { href: "/istatistikler", icon: BarChart3, label: "İstatistikler" },
  { href: "/ekip", icon: Users, label: "Ekip" },
  { href: "/sozlesmeler", icon: FileText, label: "Sözleşmeler" },
  { href: "/musteriler", icon: UserCircle, label: "Müşteriler" },
  { href: "/notlar", icon: StickyNote, label: "Notlar" },
  { href: "/projeler/yeni", icon: Plus, label: "Yeni Proje" },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { visible, toggle } = useMoneyVisibility()

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 glass-effect transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden border-2 border-primary/20">
                  <img 
                    src="/brodigital-logo.png" 
                    alt="BroDigital Logo" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-12 w-12">
                  <img 
                    src="/mak-logo.png" 
                    alt="MAK Logo" 
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Bro&Mak</h1>
                <p className="text-xs text-muted-foreground">Proje Yönetimi</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden rounded-lg p-2 hover:bg-accent/50 transition-colors"
              aria-label="Menüyü Kapat"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-accent/50",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Link href="/ekip">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
            <p className="text-xs font-medium text-muted-foreground">Toplam Ekip Üyesi</p>
            <p className="mt-1 text-2xl font-bold text-foreground">3</p>
          </div>
          </Link>

          <button
            onClick={toggle}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border hover:bg-accent/50 transition-colors"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {visible ? 'Kazançları Gizle' : 'Kazançları Göster'}
          </button>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.replace('/login')
            }}
            className="mt-2 rounded-xl px-4 py-3 text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  )
}
