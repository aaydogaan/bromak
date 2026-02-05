"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Lightbulb, TrendingUp, DollarSign, FolderKanban } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface AIInsight {
    comment: string
    suggestion: string
}

type InsightType = 'general' | 'expenses' | 'projects' | 'revenue'

export function AIInsights() {
    const [insight, setInsight] = useState<AIInsight | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<InsightType | null>(null)

    const fetchInsight = async (type: InsightType) => {
        setLoading(true)
        setSelectedType(type)
        try {
            const res = await fetch(`/api/ai/insights?type=${type}`)
            const data = await res.json()
            setInsight(data)
        } catch (error) {
            console.error("AI Insight Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const insightTypes = [
        { type: 'general' as InsightType, label: 'Genel', icon: Sparkles, color: 'text-purple-600' },
        { type: 'expenses' as InsightType, label: 'Giderler', icon: DollarSign, color: 'text-red-600' },
        { type: 'projects' as InsightType, label: 'Projeler', icon: FolderKanban, color: 'text-blue-600' },
        { type: 'revenue' as InsightType, label: 'Gelir', icon: TrendingUp, color: 'text-green-600' },
    ]

    return (
        <Card className="overflow-hidden border border-zinc-200/50 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 border-b border-zinc-100 bg-zinc-50/50">
                <CardTitle className="text-xs font-semibold text-zinc-800 flex items-center gap-2 uppercase tracking-tight">
                    <Sparkles className="h-3.5 w-3.5 text-[#e2150c] animate-pulse" />
                    AI Analizi
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-4">
                {!insight ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            {insightTypes.map((item) => (
                                <Button
                                    key={item.type}
                                    onClick={() => fetchInsight(item.type)}
                                    disabled={loading}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 px-2 flex flex-col items-center gap-0.5 hover:bg-zinc-50 hover:border-[#e2150c]/20 transition-all group text-[10px]"
                                >
                                    <item.icon className={`h-3.5 w-3.5 ${item.color} group-hover:scale-110 transition-transform`} />
                                    <span className="font-medium text-zinc-700 leading-tight">{item.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                <div className="h-3 w-full bg-zinc-100 animate-pulse rounded-full" />
                                <div className="h-3 w-4/5 bg-zinc-100 animate-pulse rounded-full" />
                                <div className="h-10 w-full bg-zinc-50 border border-zinc-100 animate-pulse rounded-xl mt-2" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                <p className="text-xs font-medium text-zinc-700 leading-relaxed">
                                    {insight?.comment}
                                </p>

                                <div className="flex items-start gap-2 rounded-xl bg-[#e2150c]/5 p-2.5 border border-[#e2150c]/10">
                                    <Lightbulb className="h-3.5 w-3.5 text-[#e2150c] shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-zinc-600 font-medium leading-relaxed">
                                        {insight?.suggestion}
                                    </p>
                                </div>

                                <Button
                                    onClick={() => {
                                        setInsight(null)
                                        setSelectedType(null)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-7 text-[10px] text-zinc-500 hover:text-zinc-700"
                                >
                                    Başka analiz
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </CardContent>
        </Card>
    )
}
