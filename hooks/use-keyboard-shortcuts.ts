"use client"

import { useEffect } from "react"

interface KeyboardShortcut {
    key: string
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    callback: () => void
    description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            shortcuts.forEach((shortcut) => {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
                const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
                const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
                const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    // Prevent default browser behavior
                    event.preventDefault()
                    shortcut.callback()
                }
            })
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [shortcuts])
}

/**
 * Hook to show keyboard shortcuts help
 */
export function useKeyboardShortcutsHelp(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Show help with Shift + ?
            if (event.shiftKey && event.key === "?") {
                event.preventDefault()
                const helpText = shortcuts
                    .map((s) => {
                        const keys = []
                        if (s.ctrlKey) keys.push("Ctrl")
                        if (s.shiftKey) keys.push("Shift")
                        if (s.altKey) keys.push("Alt")
                        keys.push(s.key.toUpperCase())
                        return `${keys.join(" + ")}: ${s.description}`
                    })
                    .join("\n")

                alert(`⌨️ Klavye Kısayolları:\n\n${helpText}\n\nShift + ?: Bu yardımı göster`)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [shortcuts])
}
