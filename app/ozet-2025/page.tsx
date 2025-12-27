"use client"

import { useEffect, useRef, useState } from "react"

type MediaItem = { id: number; jpg: string; jpeg: string; png: string; mp4: string }
type TimelineItem = {
  id: string
  date: string
  title: string
  desc: string
  media: number[] // references to media ids
}

export default function Summary2025Page() {

  const media: MediaItem[] = Array.from({ length: 40 }).map((_, i) => {
    const id = i + 1
    // Specific video assignments
    const isVideo = id === 8 || id === 2
    return {
      id,
      jpg: `/anilar/${id}.jpg`,
      jpeg: `/anilar/${id}.jpeg`,
      png: `/anilar/${id}.png`,
      mp4: isVideo ? `/anilar/${id}.mp4` : `/anilar/${id}.mp4`,
    }
  })

  const items: TimelineItem[] = [
    {
      id: "merge",
      date: "2025 İlkbahar",
      title: "Birleşme – Yeni Başlangıç",
      desc: "7 ay önce başlayan ortak yolculuk: vizyonları birleştirip tek bir çatı altında güçlendik.",
      media: [1, 2, 3],
    },
    {
      id: "essen-hidrolik",
      date: "Anı",
      title: "Essen Hidrolik Çekimi",
      desc: "Essen'de çekimde orada çalışan Enes diye birisi var, kamera önünden tırsıyor. Enes bidahakinde 'sen konuşacaksın' dedik, çocuk kalpten gidecekti.",
      media: [17],
    },
    {
      id: "dies",
      date: "2025 Yaz",
      title: "DİES Gıda ile Zirve",
      desc: "7 aylık dönemde en yüksek maddi getiriyi sağlayan proje; üstelik 1 yıllık anlaşma ile güven tazelendi.",
      media: [9, 11 ],
    },
    {
      id: "quote",
      date: "Yolculuk Notu",
      title: "Tutkuyla 18 Saat",
      desc: "Başkalarının işinde 8 saat çalışmamak için kendi işimizi kurduk; onda da tutkuyla 18 saat çalıştık.",
      media: [6,2 ],
    },
    {
      id: "mem-1",
      date: "Anı",
      title: "Dizipal Gafı",
      desc: "DİES Gıda toplantısında İpek Hanım’la, bir anlık ‘Dizipal’ gafı sonrası kahkahalar…",
      media: [7],
    },
    {
      id: "mem-2",
      date: "Anı",
      title: "Beyaz Yalanlar",
      desc: "Enes & Recep – her iş bağlama görüşmesinde meşhur ‘ufak tefek’ beyaz yalanlar.",
      media: [9],
    },
    {
      id: "mem-3",
      date: "Anı",
      title: "BROMAK Logo Hikayesi",
      desc: "‘m’ harfi baş aşağı 3’e dönüşür: 3 ortak, tek hikâye. Enes’in kahkahaları eşliğinde…",
      media: [18],
    },
    {
      id: "foodlabs",
      date: "Anı",
      title: "Foodlabs Hayal Kırıklığı",
      desc: "Saatlerce dil döküyoruz, iş bir türlü bize verilmiyor. Tasarım dilimiz aynıymış ama yine kötü tasarımlar yapılıyor, bizden değilmiş gibi davranıyorlar.",
      media: [11],
    },


    {
      id: "nem-4",
      date: "Eğlencesine",
      title: "Seni bi S****M",
      desc: "Gırgır şamata.",
      media: [8, 15],
    },

    {
      id: "enes-park",
      date: "Anı",
      title: "Enes'in Müthiş Park Yeteneği",
      desc: "Enes'in inanılmaz park yeteneği, her aracı en dar yerlere sığdırması bir sanat.",
      media: [16],
    },
    {
      id: "office",
      date: "1 Ocak 2026",
      title: "Ofis Açılışı",
      desc: "3 ekibin hayali, yeni bir sayfanın başlığı oluyor: kapılarımız 1 Ocak 2026’da açılıyor.",
      media: [13],
    },

    
  ]

  

  const mediaOverrides: Partial<Record<number, Partial<MediaItem>>> = {
    11: { jpeg: "/anilar/11.jpeg" },
    2: { mp4: "/anilar/2.mp4" },
    8: { mp4: "/anilar/8.mp4" },
    16: { jpeg: "/anilar/16.jpeg" },
    17: { jpeg: "/anilar/17.jpeg" },
  }

  // Media fallback component: jpeg -> jpg -> png -> mp4 -> none
  const Media: React.FC<{ mid: number }> = ({ mid }) => {
    const [stage, setStage] = useState<"jpeg" | "jpg" | "png" | "mp4" | "none">("mp4")
    const [isMuted, setIsMuted] = useState(true)
    const base = media[mid - 1]
    const m = base ? { ...base, ...(mediaOverrides[mid] || {}) } : null
    if (!m) return null
    if (stage === "mp4") {
      return (
        <div className="relative h-full w-full">
          <video
            className="h-full w-full object-cover"
            src={m.mp4}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            onError={() => setStage("jpeg")}
          />
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors"
          >
            {isMuted ? "Ses Aç" : "Ses Kapat"}
          </button>
        </div>
      )
    }
    if (stage === "none") return <div className="h-full w-full bg-muted" />
    return (
      <img
        src={stage === "jpeg" ? m.jpeg : stage === "jpg" ? m.jpg : m.png}
        alt={`Anı ${mid}`}
        className="h-full w-full object-cover"
        onError={() => setStage("none")}
      />
    )
  }

  // Section reveal side fireworks
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!containerRef.current) return
    const root = containerRef.current
    const burst = (y: number) => {
      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.inset = '0'
      overlay.style.pointerEvents = 'none'
      overlay.style.zIndex = '9998'
      document.body.appendChild(overlay)
      const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899']
      const spawn = (side: 'left'|'right') => {
        for (let i=0;i<40;i++){
          const d = document.createElement('div')
          d.style.position = 'absolute'
          d.style.top = `${y + (Math.random()*120-60)}px`
          d.style[side] = '0px'
          d.style.width = `${Math.random()*8+4}px`
          d.style.height = `${Math.random()*14+6}px`
          d.style.background = colors[Math.floor(Math.random()*colors.length)]
          d.style.borderRadius = Math.random()<0.4? '9999px':'3px'
          d.style.opacity = '0.95'
          overlay.appendChild(d)
          const dx = (side==='left'?1:-1) * (200 + Math.random()*260)
          const dy = (Math.random()*2-1) * 160
          const rot = (Math.random()*720-360).toFixed(1)
          const dur = 900 + Math.random()*900
          d.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
          ], { duration: dur, easing: 'cubic-bezier(0.2,0.7,0.3,1)', fill: 'forwards' })
          setTimeout(()=>d.remove(), dur+80)
        }
      }
      spawn('left'); spawn('right')
      setTimeout(()=>overlay.remove(), 1800)
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting){
          burst(e.boundingClientRect.top + e.boundingClientRect.height / 2)
          io.unobserve(e.target)
        }
      }
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0.15 })
    const nodes = root.querySelectorAll('[data-tl-item="1"]')
    nodes.forEach(n=>io.observe(n))
    // Extra: on mobile, trigger a bit earlier for visibility
    let ioMobile: IntersectionObserver | null = null
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      ioMobile = new IntersectionObserver((entries) => {
        for (const e of entries){
          if (e.isIntersecting){
            burst(e.boundingClientRect.top + e.boundingClientRect.height / 2)
            ioMobile!.unobserve(e.target)
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 })
      nodes.forEach(n=>ioMobile!.observe(n))
    }
    return () => { io.disconnect(); ioMobile?.disconnect() }
  }, [])

  return (
    <div className="min-h-screen w-full bg-background">
      {/* HERO full-screen with background image */}
      <header
        className="relative flex min-h-screen items-center justify-center text-center"
        style={{ backgroundImage: "url('/images/gradient-background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="relative z-10 px-6">
          <img src="/bromak.png" alt="Bromak" className="mx-auto h-16 md:h-20 w-auto object-contain opacity-95" />
          <div className="mt-6 text-[72px] md:text-[120px] leading-none font-extrabold tracking-tight">2025</div>
          <div className="mt-2 text-2xl md:text-4xl text-foreground/95 font-semibold">YILIN ÖZETİ</div>
          <button
            onClick={() => {
              const el = document.getElementById('timeline')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm md:text-base text-foreground/80 hover:text-foreground bg-background/70"
          >
            AŞAĞI KAYDIR
          </button>
        </div>
        <div className="absolute inset-0 bg-black/0" aria-hidden />
      </header>

      {/* 2025 FINANCIAL SUMMARY */}
      <section className="mx-auto max-w-6xl px-4 md:px-8 py-10 md:py-14">
        <div className="rounded-2xl border bg-background/80 backdrop-blur-sm p-6 md:p-10 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-3 text-center">
              <div className="text-[11px] md:text-xs tracking-widest text-muted-foreground uppercase">Bu Yıl Toplam Kazanç</div>
              <div className="mt-3 text-5xl md:text-7xl font-extrabold tracking-tight">₺197.500</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-[11px] md:text-xs tracking-widest text-muted-foreground uppercase">En İyi Müşteriler</div>
              <ul className="mt-3 divide-y">
                <li className="flex items-center justify-between py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">SE</div>
                    <div>
                      <div className="font-medium">Selçuk Ekinci</div>
                      <div className="text-xs text-muted-foreground">6 proje</div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">₺45.000</div>
                </li>
                <li className="flex items-center justify-between py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">MD</div>
                    <div>
                      <div className="font-medium">Mustafa Deniz</div>
                      <div className="text-xs text-muted-foreground">1 proje</div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">₺35.000</div>
                </li>
                <li className="flex items-center justify-between py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">MB</div>
                    <div>
                      <div className="font-medium">Muhammed Ali Büyükmatür</div>
                      <div className="text-xs text-muted-foreground">2 proje</div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">₺30.000</div>
                </li>
                <li className="flex items-center justify-between py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">MY</div>
                    <div>
                      <div className="font-medium">Mustafa Yorulmaz</div>
                      <div className="text-xs text-muted-foreground">1 proje</div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">₺22.500</div>
                </li>
                <li className="flex items-center justify-between py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">HK</div>
                    <div>
                      <div className="font-medium">Hasan Kara</div>
                      <div className="text-xs text-muted-foreground">2 proje</div>
                    </div>
                  </div>
                  <div className="text-sm md:text-base font-semibold">₺16.000</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CENTERED TIMELINE with alternating cards */}
      <main id="timeline" ref={containerRef} className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 md:-translate-x-1/2 w-px bg-border/70 h-full" aria-hidden />
          <ul className="space-y-12 md:space-y-16">
            {items.map((it, idx) => {
              const right = idx % 2 === 1
              return (
                <li key={it.id} className="relative pt-6 md:pt-2" data-tl-item="1">
                  <div className="md:grid md:grid-cols-[1fr_96px_1fr] md:gap-6">
                    {/* left column (desktop) / full width (mobile) */}
                    <div
                      className={
                        (right ? 'hidden md:block' : 'pl-14 md:pl-0 md:pr-6 md:justify-self-end') +
                        ' md:w-full'
                      }
                    >
                      {!right && (
                        <div className="rounded-2xl border bg-background/80 backdrop-blur-sm p-5 md:p-6 shadow-sm md:max-w-[520px]">
                          <div className="text-xs text-muted-foreground">{it.date}</div>
                          <div className="mt-1 text-xl font-semibold text-foreground">{it.title}</div>
                          <p className="mt-2 text-sm text-foreground/90">{it.desc}</p>
                          {it.media.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-6">
                              {it.media.map((mid) => (
                                <figure key={mid} className="relative aspect-4/3 overflow-hidden rounded-xl border bg-card md:aspect-video">
                                  <Media mid={mid} />
                                  {mid === 11 && (
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-white">
                                      "Beni yalnız bırakmayacaksınız, değil mi?"
                                    </figcaption>
                                  )}
                                  {mid === 14 && (
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-white">
                                      "Nereye düştük bakışı"
                                    </figcaption>
                                  )}
                                </figure>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* center column: pin */}
                    <div className="relative flex justify-start md:justify-center">
                      <div className="absolute left-6 top-0 -translate-x-1/2 md:left-1/2 md:top-0 md:-translate-x-1/2 h-14 w-14 rounded-full bg-background border flex items-center justify-center shadow-md">
                        <img src="/bromak.png" alt="Bromak" className="h-9 w-9 object-contain" />
                      </div>
                      <div className="h-14 w-px opacity-0 md:opacity-100" aria-hidden />
                    </div>

                    {/* right column (desktop) */}
                    <div
                      className={
                        (right ? 'pl-14 md:pl-6 md:justify-self-start' : 'hidden md:block') +
                        ' md:w-full'
                      }
                    >
                      {right && (
                        <div className="rounded-2xl border bg-background/80 backdrop-blur-sm p-5 md:p-6 shadow-sm md:max-w-[520px]">
                          <div className="text-xs text-muted-foreground">{it.date}</div>
                          <div className="mt-1 text-xl font-semibold text-foreground">{it.title}</div>
                          <p className="mt-2 text-sm text-foreground/90">{it.desc}</p>
                          {it.media.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-6">
                              {it.media.map((mid) => (
                                <figure key={mid} className="relative aspect-4/3 overflow-hidden rounded-xl border bg-card md:aspect-video">
                                  <Media mid={mid} />
                                  {mid === 11 && (
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-white">
                                      "Beni yalnız bırakmayacaksınız, değil mi?"
                                    </figcaption>
                                  )}
                                  {mid === 14 && (
                                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-xs text-white">
                                      "Nereye düştük bakışı"
                                    </figcaption>
                                  )}
                                </figure>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </main>
    </div>
  )
}
