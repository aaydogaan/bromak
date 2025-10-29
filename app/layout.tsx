import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import AuthGuard from "@/components/auth-guard"
import { MoneyVisibilityProvider } from "@/components/money-visibility"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bro&Mak - Proje Yönetim Paneli",
  description: "Proje ve gelir yönetim sistemi",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} font-sans antialiased`}>
        <MoneyVisibilityProvider>
          <AuthGuard>{children}</AuthGuard>
        </MoneyVisibilityProvider>
        <Analytics />
      </body>
    </html>
  )
}
