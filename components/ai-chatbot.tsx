"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Merhaba! Ben Bromak AI asistanıyım. Projeler, gelirler veya izinler hakkında sana nasıl yardımcı olabilirim?' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMessage] })
            })
            const data = await res.json()

            if (data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.content }])
            } else {
                throw new Error('Yanıt alınamadı')
            }
        } catch (error) {
            console.error('Chat Error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Üzgünüm, şu an bağlantı kuramıyorum. Lütfen sonra tekrar dene.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Floating Button */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "h-14 w-14 rounded-full shadow-[0_8px_30px_rgb(226,21,12,0.3)] transition-all duration-500",
                        "bg-[#e2150c] hover:bg-[#c4120a] group",
                        isOpen && "scale-0 opacity-0"
                    )}
                >
                    <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
                </Button>
            </motion.div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white border border-zinc-200 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col z-[51] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-br from-[#e2150c] to-[#c4120a] flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white tracking-tight">Bromak AI Asistan</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <p className="text-[10px] font-medium text-white/80">Canlı Destek Sistemi</p>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 scroll-smooth"
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex flex-col gap-1.5 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center gap-2 mb-0.5",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <div className={cn(
                                            "h-5 w-5 rounded-md flex items-center justify-center",
                                            msg.role === 'user' ? "bg-zinc-200" : "bg-[#e2150c]/10"
                                        )}>
                                            {msg.role === 'user' ? <User className="h-3 w-3 text-zinc-500" /> : <Bot className="h-3 w-3 text-[#e2150c]" />}
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            {msg.role === 'user' ? 'Siz' : 'Bromak AI'}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-[#e2150c] text-white rounded-tr-none font-medium"
                                            : "bg-white text-zinc-700 border border-zinc-100 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex flex-col gap-1.5 mr-auto max-w-[85%]">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="h-5 w-5 rounded-md bg-[#e2150c]/10 flex items-center justify-center">
                                            <Loader2 className="h-3 w-3 text-[#e2150c] animate-spin" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bromak AI Düşünüyor...</span>
                                    </div>
                                    <div className="px-5 py-4 rounded-2xl bg-white border border-zinc-100 rounded-tl-none shadow-sm flex gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-[#e2150c]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-[#e2150c]/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                        <span className="w-1.5 h-1.5 bg-[#e2150c]/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="px-6 py-6 bg-white border-t border-zinc-100">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center group"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Nasıl yardımcı olabilirim?"
                                    className={cn(
                                        "pl-5 pr-14 h-14 bg-zinc-50 border-zinc-200 text-zinc-800 rounded-2xl focus:bg-white focus:border-[#e2150c] focus:ring-4 focus:ring-[#e2150c]/5 transition-all duration-300 placeholder:text-zinc-400 font-medium",
                                        "shadow-inner"
                                    )}
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="absolute right-2 h-10 w-10 p-0 bg-[#e2150c] hover:bg-[#c4120a] rounded-xl shadow-lg shadow-[#e2150c]/20 hover:scale-105 active:scale-95 transition-all text-white disabled:bg-zinc-200 disabled:shadow-none"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                            <div className="flex items-center justify-center gap-1.5 mt-4">
                                <Sparkles className="h-3 w-3 text-zinc-300" />
                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Powered by Gemini 2.0</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
