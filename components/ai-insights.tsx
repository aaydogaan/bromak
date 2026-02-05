"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Lightbulb, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AIInsight {
    comment: string
    suggestion: string
}

export function AIInsights() {
    const [insight, setInsight] = useState<AIInsight | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchInsight = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/ai/insights")
            const data = await res.json()
            setInsight(data)
        } catch (error) {
            console.error("AI Insight Error:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInsight()
    }, [])

    return (
        <Card className="overflow-hidden border-none bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#e2150c]/5 shadow-xl ring-1 ring-white/10">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#e2150c]" />
                        AI Analizi & Önerisi
                    </CardTitle>
                    <button
                        onClick={fetchInsight}
                        disabled={loading}
                        className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2 py-2"
                        >
                            <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
                            <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-zinc-200 leading-relaxed italic">
                                "{insight?.comment}"
                            </p>

                            <div className="flex items-start gap-3 rounded-lg bg-[#e2150c]/10 p-3 ring-1 ring-[#e2150c]/20">
                                <Lightbulb className="h-4 w-4 text-[#e2150c] shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-[#e2150c] uppercase tracking-wider">Tavsiye</p>
                                    <p className="text-xs text-zinc-300">
                                        {insight?.suggestion}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
