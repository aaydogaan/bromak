"use client"

import { createContext, useContext, useState } from "react"

type Ctx = {
  visible: boolean
  toggle: () => void
}

const MoneyVisibilityContext = createContext<Ctx | null>(null)

export function MoneyVisibilityProvider({ children }: { children: React.ReactNode }) {
  // Default visible as requested
  const [visible, setVisible] = useState(true)
  return (
    <MoneyVisibilityContext.Provider value={{ visible, toggle: () => setVisible(v => !v) }}>
      {children}
    </MoneyVisibilityContext.Provider>
  )
}

export function useMoneyVisibility() {
  const ctx = useContext(MoneyVisibilityContext)
  if (!ctx) throw new Error("useMoneyVisibility must be used within MoneyVisibilityProvider")
  return ctx
}
