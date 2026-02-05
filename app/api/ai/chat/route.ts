import { NextRequest, NextResponse } from 'next/server'
import { OpenRouter } from '@openrouter/sdk'
import { getBromakContext } from '@/lib/ai-context'

const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || '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',
})

const headers = {
    'HTTP-Referer': 'https://bromak.brodigitalmedia.com',
    'X-Title': 'Bromak Management System',
}


export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()
        const context = await getBromakContext()

        const systemPrompt = `
      Sen Bromak Agency'nin akıllı asistanısın. Görevin, Bromak Yönetim Sistemi'ndeki verileri kullanarak kullanıcıya yardımcı olmaktır.
      
      Şu anki sistem verileri:
      - Toplam Proje: ${context.summary.totalProjects}
      - Aktif Proje (Devam Eden): ${context.summary.activeProjects}
      - Tamamlanan Proje: ${context.summary.completedProjects}
      - Toplam Gelir: ₺${context.summary.totalRevenue.toLocaleString('tr-TR')}
      - Toplam Gider (Bu Ay): ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
      - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
      - Şu an/Yakın zamanda izinde olan kişi sayısı: ${context.summary.onLeaveCount}

      Detaylı Proje Listesi:
      ${JSON.stringify(context.projects, null, 2)}

      Son Giderler:
      ${JSON.stringify(context.recentExpenses, null, 2)}

      Yaklaşan İzinler:
      ${JSON.stringify(context.upcomingLeaves, null, 2)}

      Kurallar:
      1. Her zaman profesyonel, yardımsever ve Bromak markasına uygun bir ton kullan.
      2. Cevaplarını yukarıdaki verilere dayandır. Eğer sistemde olmayan bir veri sorulursa, "Bu bilgiye şu an erişemiyorum" de.
      3. Finansal özetler yaparken net kar/zarar durumunu vurgula.
      4. Cevapların kısa, öz ve anlaşılır olsun. Markdown formatını kullanabilirsin.
      5. Türkçe konuş.
    `

        const response = await openRouter.chat.send({
            model: 'google/gemini-2.0-flash-001', // High performance and cost effective
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
        }, { headers })

        const aiMessage = response.choices[0].message
        return NextResponse.json(aiMessage)
    } catch (error) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({ error: 'AI asistanı şu an yanıt veremiyor.' }, { status: 500 })
    }
}
