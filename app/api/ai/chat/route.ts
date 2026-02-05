import { NextRequest, NextResponse } from 'next/server'
import { OpenRouter } from '@openrouter/sdk'
import { getBromakContext } from '@/lib/ai-context'

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is missing from environment variables')
            return NextResponse.json({ error: 'API Anahtarı bulunamadı.' }, { status: 500 })
        }

        const openRouter = new OpenRouter({ apiKey })

        const { messages } = await request.json()
        const context = await getBromakContext()

        const systemPrompt = `
      Sen Bromak Agency'nin akıllı asistanısın. Görevin, Bromak Yönetim Sistemi'ndeki TÜM verileri kullanarak kullanıcıya yardımcı olmaktır.
      
      📊 ÖZET VERİLER:
      - Toplam Proje: ${context.summary.totalProjects} (Aktif: ${context.summary.activeProjects}, Tamamlanan: ${context.summary.completedProjects})
      - Toplam Gelir: ₺${context.summary.totalRevenue.toLocaleString('tr-TR')}
      - Bu Ayki Gider: ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
      - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
      - Çalışan Sayısı: ${context.summary.totalEmployees}
      - Müşteri Sayısı: ${context.summary.totalClients}
      - İzinde/Yakında İzne Çıkacak: ${context.summary.onLeaveCount} kişi

      📁 PROJELER:
      ${JSON.stringify(context.projects, null, 2)}

      💰 GİDERLER (Bu Ay):
      ${JSON.stringify(context.recentExpenses, null, 2)}
      
      Kategorilere Göre Giderler:
      ${JSON.stringify(context.expensesByCategory, null, 2)}

      🏖️ YAKIN İZİNLER:
      ${JSON.stringify(context.upcomingLeaves, null, 2)}

      👥 ÇALIŞANLAR:
      ${JSON.stringify(context.employees, null, 2)}

      🏢 MÜŞTERİLER:
      ${JSON.stringify(context.clients, null, 2)}

      📋 KURALLAR:
      1. Her zaman profesyonel, yardımsever ve Bromak markasına uygun bir ton kullan.
      2. Cevaplarını yukarıdaki verilere dayandır. Eğer sistemde olmayan bir veri sorulursa, "Bu bilgiye şu an erişemiyorum" de.
      3. Finansal özetler yaparken net kar/zarar durumunu vurgula.
      4. Proje, çalışan, müşteri veya gider sorularına detaylı cevap ver.
      5. Cevapların kısa, öz ve anlaşılır olsun. Markdown formatını kullanabilirsin.
      6. Türkçe konuş ve samimi bir dil kullan.
      7. Sayıları Türkçe formatında göster (örn: 1.234,56 TL).
    `

        const response = await openRouter.chat.send({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
        }, {
            headers: {
                'HTTP-Referer': 'https://bromak.brodigitalmedia.com',
                'X-Title': 'Bromak Management System',
            }
        })

        const aiMessage = response.choices[0].message
        return NextResponse.json(aiMessage)
    } catch (error: any) {
        console.error('AI Chat Error Details:', {
            message: error?.message,
            statusCode: error?.statusCode,
            body: error?.body,
            stack: error?.stack
        })
        return NextResponse.json({
            error: 'AI asistanı şu an yanıt veremiyor.',
            details: error?.message
        }, { status: 500 })
    }
}
