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
        <Card className="overflow-hidden border border-zinc-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-800 flex items-center gap-2 uppercase tracking-tight">
                        <Sparkles className="h-4 w-4 text-[#e2150c] animate-pulse" />
                        AI Analizi & Önerisi
                    </CardTitle>
                    <button
                        onClick={fetchInsight}
                        disabled={loading}
                        className="p-1.5 rounded-full hover:bg-zinc-200/50 text-zinc-500 hover:text-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                        title="Analizi Yenile"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-zinc-100 animate-pulse rounded-full" />
                                <div className="h-4 w-5/6 bg-zinc-100 animate-pulse rounded-full" />
                            </div>
                            <div className="h-12 w-full bg-zinc-50 border border-zinc-100 animate-pulse rounded-xl" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                        >
                            <div className="relative">
                                <span className="absolute -left-2 -top-1 text-4xl text-zinc-100 font-serif pointer-events-none">“</span>
                                <p className="text-[15px] font-medium text-zinc-700 leading-relaxed pl-4 relative">
                                    {insight?.comment}
                                </p>
                            </div>

                            <div className="flex items-start gap-3.5 rounded-2xl bg-[#e2150c]/5 p-4 border border-[#e2150c]/10 group hover:border-[#e2150c]/20 transition-colors">
                                <div className="h-8 w-8 rounded-full bg-white shadow-sm border border-[#e2150c]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Lightbulb className="h-4 w-4 text-[#e2150c]" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[#e2150c] uppercase tracking-[0.1em]">AI Stratejik Öneri</p>
                                    <p className="text-sm text-zinc-600 font-medium">
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
