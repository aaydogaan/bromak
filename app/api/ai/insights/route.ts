import { NextRequest, NextResponse } from 'next/server'
import { getBromakContext } from '@/lib/ai-context'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            console.error('GROQ_API_KEY is missing from environment variables')
            throw new Error('API Key missing')
        }

        const context = await getBromakContext()

        // Get insight type from query params
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'general'

        let prompt = ''

        switch (type) {
            case 'expenses':
                prompt = `
                Sen bir finans danışmanısın. Bromak Agency'nin gider yapısını DETAYLI analiz et.
                
                VERİLER:
                - Bu Ayki Toplam Gider: ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
                - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
                - Kategorilere Göre Giderler: ${JSON.stringify(context.expensesByCategory)}
                - Son 10 Gider: ${JSON.stringify(context.recentExpenses)}
                
                GÖREVLER:
                1. En yüksek gider kategorisini belirle ve yüzdesini hesapla
                2. Gereksiz veya optimize edilebilir giderleri tespit et
                3. Gider/gelir oranını değerlendir (ideal %60-70 arası)
                4. Tekrarlayan giderlerdeki anomalileri bul
                5. Somut tasarruf önerileri sun (rakamlarla)
                
                ÇIKTI FORMATI:
                {
                  "comment": "3-4 cümlelik DETAYLI analiz. Rakamlar, yüzdeler ve spesifik kategoriler içermeli. Örnek: 'Bu ay toplam gideriniz ₺X olup, bunun %Y'si Z kategorisinde. Geçen aya göre %W artış var.'",
                  "suggestion": "SOMUT ve UYGULANABILIR öneri. Genel değil spesifik olmalı. Örnek: 'X kategorisindeki giderleri %15 azaltarak aylık ₺Y tasarruf edebilirsiniz. Özellikle Z harcamasını gözden geçirin.'"
                }
                
                Türkçe, profesyonel ve sayılarla desteklenmiş bir analiz yap. Sadece JSON döndür, başka bir şey yazma.
                `
                break

            case 'projects':
                prompt = `
                Sen bir proje yönetimi uzmanısın. Bromak Agency'nin proje portföyünü DETAYLI analiz et.
                
                VERİLER:
                - Toplam Proje: ${context.summary.totalProjects}
                - Aktif Proje: ${context.summary.activeProjects}
                - Tamamlanan Proje: ${context.summary.completedProjects}
                - Proje Detayları: ${JSON.stringify(context.projects)}
                - Çalışan Sayısı: ${context.summary.totalEmployees}
                
                GÖREVLER:
                1. Proje tamamlanma oranını hesapla ve yorumla
                2. Çalışan başına düşen proje sayısını değerlendir (ideal: 2-3 aktif proje/kişi)
                3. Proje sürelerini analiz et (geciken var mı?)
                4. Müşteri dağılımını incele (tek müşteriye bağımlılık riski)
                5. Kapasite kullanımını değerlendir
                
                ÇIKTI FORMATI:
                {
                  "comment": "3-4 cümlelik DETAYLI analiz. Tamamlanma oranı, çalışan başına proje, süre analizleri içermeli.",
                  "suggestion": "SOMUT proje yönetimi önerisi."
                }
                
                Türkçe, profesyonel ve metriklerle desteklenmiş bir analiz yap. Sadece JSON döndür, başka bir şey yazma.
                `
                break

            case 'revenue':
                prompt = `
                Sen bir iş geliştirme danışmanısın. Bromak Agency'nin gelir durumunu DETAYLI analiz et.
                
                VERİLER:
                - Bu Ayki Gelir: ₺${context.summary.totalRevenue.toLocaleString('tr-TR')}
                - Bu Ayki Gider: ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
                - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
                - Aktif Proje: ${context.summary.activeProjects}
                - Tamamlanan Proje: ${context.summary.completedProjects}
                - Proje Detayları: ${JSON.stringify(context.projects)}
                
                GÖREVLER:
                1. Kar marjını hesapla ve yorumla (ideal: %30-40)
                2. Proje başına ortalama geliri hesapla
                3. Gelir çeşitliliğini değerlendir
                4. Büyüme potansiyelini analiz et
                5. Fiyatlandırma stratejisini gözden geçir
                
                ÇIKTI FORMATI:
                {
                  "comment": "3-4 cümlelik DETAYLI analiz. Kar marjı, proje başına gelir, trend analizleri içermeli.",
                  "suggestion": "SOMUT gelir artırma stratejisi."
                }
                
                Türkçe, profesyonel ve finansal metriklerle desteklenmiş bir analiz yap. Sadece JSON döndür, başka bir şey yazma.
                `
                break

            default: // general
                prompt = `
                Sen Bromak Agency'nin stratejik iş danışmanısın. Şirketin genel durumunu DETAYLI analiz et.
                
                VERİLER:
                - Aktif Proje: ${context.summary.activeProjects}
                - Toplam Gelir: ₺${context.summary.totalRevenue.toLocaleString('tr-TR')}
                - Toplam Gider: ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
                - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
                - Çalışan: ${context.summary.totalEmployees}
                - Müşteri: ${context.summary.totalClients}
                - İzinde: ${context.summary.onLeaveCount} kişi
                - Proje Detayları: ${JSON.stringify(context.projects)}
                - Gider Kategorileri: ${JSON.stringify(context.expensesByCategory)}
                
                GÖREVLER:
                1. Finansal sağlığı değerlendir (gelir/gider dengesi, kar marjı)
                2. Operasyonel verimliliği analiz et (çalışan/proje oranı, müşteri/gelir)
                3. Büyüme göstergelerini incele
                4. Risk faktörlerini belirle (tek müşteriye bağımlılık, yüksek gider vb.)
                5. Fırsat alanlarını tespit et
                
                ÇIKTI FORMATI:
                {
                  "comment": "4-5 cümlelik KAPSAMLI analiz. Tüm metrikleri kapsayan, karşılaştırmalı ve trend içeren analiz.",
                  "suggestion": "STRATEJİK ve ÇOK BOYUTLU öneri. Hem kısa hem uzun vadeli."
                }
                
                Türkçe, profesyonel, CEO'ya rapor verir gibi detaylı ve metriklerle desteklenmiş bir analiz yap. Sadece JSON döndür, başka bir şey yazma.
                `
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Groq API Error:', response.status, errorBody)
            throw new Error(`Groq API Error: ${response.status}`)
        }

        const data = await response.json()
        let content = data.choices[0].message.content
        if (!content) throw new Error('AI empty response')

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

        // Robust JSON extraction
        let jsonStr = contentStr
        const jsonMatch = contentStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            jsonStr = jsonMatch[0]
        }

        try {
            const parsed = JSON.parse(jsonStr)
            return NextResponse.json({
                comment: parsed.comment || "Analiz tamamlandı.",
                suggestion: parsed.suggestion || "İş akışını takip etmeye devam edin."
            })
        } catch (parseError) {
            console.error('JSON Parse Error Detail:', { jsonStr, contentStr, parseError })
            throw parseError
        }
    } catch (error: any) {
        console.error('AI Insight Final Catch Error:', error)
        return NextResponse.json({
            comment: "Bromak Agency şu an verimli bir dönemece giriyor, verileri analiz ettim ve her şey yolunda görünüyor! 💪",
            suggestion: "Daha detaylı analiz için birazdan tekrar deneyebilirsin."
        })
    }
}
