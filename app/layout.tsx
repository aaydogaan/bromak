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
  icons: {
    icon: [
      { url: '/bromak-favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/bromak-favicon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/bromak-favicon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/bromak-favicon-180x180.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  appleWebApp: {
    title: 'BroMak',
    statusBarStyle: 'black-translucent',
    startupImage: '/bromak-favicon-512x512.png',
  },
  manifest: "/manifest.webmanifest",
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
          <AuthGuard>
            {children}
          </AuthGuard>
        </MoneyVisibilityProvider>
        <Analytics />
      </body>
    </html>
  )
}
