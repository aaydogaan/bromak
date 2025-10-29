"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useMoneyVisibility } from "@/components/money-visibility"

interface MoneyProps {
  value: string
  className?: string
  iconClassName?: string
}

export default function Money({ value, className }: MoneyProps) {
  const { visible } = useMoneyVisibility()
  const [hidden] = useState(!visible)
  // When global visibility changes, component rerenders via context; keep local state only for initial render fallback
  return <span className={cn(className)}>{visible ? value : mask(value)}</span>
}

function mask(text: string) {
  // Keep currency symbol, mask digits
  return text.replace(/[0-9]/g, "*")
}
