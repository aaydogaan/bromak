"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        if (pathname?.startsWith("/login")) {
          if (typeof document !== 'undefined') {
            document.body.classList.remove('auth-hidden')
            document.body.classList.add('auth-visible')
          }
          setIsAuthenticated(false)
          setChecking(false)
          return
        }
        const { data } = await supabase.auth.getSession()
        if (!active) return
        if (!data.session) {
          router.replace("/login")
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(true)
        }
      } finally {
        if (active) {
          if (typeof document !== 'undefined') {
            document.body.classList.remove('auth-hidden')
            document.body.classList.add('auth-visible')
          }
          setChecking(false)
        }
      }
    }
    run()
    return () => { active = false }
  }, [pathname, router, supabase])

  if (checking) return null

  // Return children with authentication status
  return <>{children}</>
}

// Export a hook to check authentication status
export function useIsAuthenticated() {
  const pathname = usePathname()
  return !pathname?.startsWith("/login")
}
