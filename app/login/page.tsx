"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.replace("/")
    }
    check()
  }, [supabase, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.session) {
        router.replace("/")
      }
    } catch (err: any) {
      alert(err?.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.")
    } finally {
      setIsLoading(false)
    }
  }

  // Sosyal girişler kaldırıldı

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Fixed background layer to guarantee visibility */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/images/gradient-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0 opacity-0"
        style={{
          background: "rgba(0, 0, 0, 0.15)",
        }}
      ></div>

      {/* Floating glass orbs for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-50 animate-pulse"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
        ></div>
        <div
          className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full opacity-40 animate-pulse delay-1000"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full opacity-45 animate-pulse delay-500"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
        ></div>
      </div>

      <Card
        className="max-w-md hover-lift shadow-2xl relative z-10 opacity-100 w-[126%] mx-[0] border-transparent"
        style={{
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(40px) saturate(250%)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow:
            "0 32px 80px rgba(0, 0, 0, 0.3), 0 16px 64px rgba(255, 255, 255, 0.2), inset 0 3px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Image src="/brodigital-logo.png" alt="Bro Dijital" width={56} height={56} className="rounded-md object-contain" />
            <Image src="/mak-logo.png" alt="Mak" width={56} height={56} className="rounded-md object-contain" />
          </div>
          <CardTitle className="text    -3xl font-bold font-sans text-card-foreground">Bro&Mak Yönetim Paneli’ne Hoş Geldiniz</CardTitle>
          <CardDescription className="text-card-foreground/70 font-sans">
            Projelerinizi, müşterilerinizi ve sözleşmelerinizi kolayca yönetin.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-card-foreground font-sans">
                E-Posta Adresi
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="E-Posta Adresinizi girin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/40 bg-white/10 placeholder:text-card-foreground/50 text-card-foreground py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/15 transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-card-foreground font-sans">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/40 bg-white/10 placeholder:text-card-foreground/50 text-card-foreground py-3 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/15 transition-all duration-200"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full ripple-effect hover-lift font-sans font-bold py-5 transition-all duration-300"
              style={{ backgroundColor: "#0C115B", color: "white" }}
              disabled={isLoading}
            >
              {isLoading ? "Oturum Açılıyor..." : "Giriş Yap"}
            </Button>
          </form>

          {/* Sosyal girişler ve parola sıfırlama bağlantısı kaldırıldı */}
          {/* Sosyal girişler ve parola sıfırlama bağlantısı kaldırıldı */}

          {/* Alt Bilgi - Kartın içinde, formun altında */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-card-foreground/70">Bro&Mak Ajans Paneli v1.0</p>
            <p className="text-xs text-card-foreground/60">
              Geliştirici{' '}
              <a href="https://www.instagram.com/recepaydogaann" target="_blank" rel="noreferrer" className="underline">
                Recep Aydoğan
              </a>
            </p>
            <p className="text-xs text-card-foreground/50">© 2025 Bro&Mak • Tüm Hakları Saklıdır</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
