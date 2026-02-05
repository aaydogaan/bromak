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
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl transition-all duration-300 z-50",
                    "bg-[#e2150c] hover:bg-[#c4120a] group",
                    isOpen && "scale-0 opacity-0"
                )}
            >
                <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            </Button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[51] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-[#e2150c] to-[#c4120a] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Bromak AI Asistan</h3>
                                    <p className="text-[10px] text-white/70">Çevrimiçi | Tüm verilere hakim</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:bg-white/10"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                        >
                            {messages.map((msg, i) => (
                                <div key={i} className={cn(
                                    "flex items-start gap-2 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === 'user' ? "bg-zinc-800" : "bg-[#e2150c]/10 border border-[#e2150c]/20"
                                    )}>
                                        {msg.role === 'user' ? <User className="h-4 w-4 text-zinc-400" /> : <Bot className="h-4 w-4 text-[#e2150c]" />}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-[#e2150c] text-white rounded-tr-none"
                                            : "bg-zinc-900 text-zinc-200 border border-white/5 rounded-tl-none shadow-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex items-start gap-2 mr-auto max-w-[85%]">
                                    <div className="h-8 w-8 rounded-full bg-[#e2150c]/10 border border-[#e2150c]/20 flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 text-[#e2150c] animate-spin" />
                                    </div>
                                    <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="dot bg-zinc-500 w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="dot bg-zinc-500 w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="dot bg-zinc-500 w-1 h-1 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Bir soru sor..."
                                    className="bg-zinc-950 border-white/10 focus:border-[#e2150c] transition-colors h-10 text-xs"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="bg-[#e2150c] hover:bg-[#c4120a] h-10 w-10 p-0"
                                >
                                    <Send className="h-4 w-4 text-white" />
                                </Button>
                            </form>
                            <p className="text-[10px] text-zinc-500 mt-2 text-center">
                                Gemini 2.0 Flash tarafından güçlendirilmiştir.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
