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
          <div className="flex items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border border-primary/20">
              <img 
                src="/brodigital-logo.png" 
                alt="BroDigital Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="h-10 w-10">
              <img 
                src="/mak-logo.png" 
                alt="MAK Logo" 
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Bro&Mak</h1>
            <p className="text-xs text-muted-foreground">Proje Yönetimi</p>
          </div>
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
