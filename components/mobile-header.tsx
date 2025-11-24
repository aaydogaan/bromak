"use client"

import { Menu } from "lucide-react"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 lg:hidden glass-effect border-b border-border/50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <img 
            src="/bromak.png" 
            alt="Bromak Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-accent/50 transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>
      </div>
    </header>
  )
}
