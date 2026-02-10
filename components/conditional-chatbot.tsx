"use client"

import { usePathname } from "next/navigation"
import { AIChatbot } from "./ai-chatbot"

export function ConditionalChatbot() {
    const pathname = usePathname()

    // Don't show chatbot on login page
    if (pathname?.startsWith("/login")) {
        return null
    }

    return <AIChatbot />
}
