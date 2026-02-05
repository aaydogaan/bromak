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


export async function GET(request: NextRequest) {
    try {
        const context = await getBromakContext()

        const prompt = `
      Bromak Agency'nin finansal ve operasyonel verilerini analiz et ve kısa, etkileyici bir "AI Yorumu" oluştur. 
      Sadece 2-3 cümlelik çok kısa bir özet ve bir de "AI Önerisi" ver.
      
      Veriler:
      - Aktif Projeler: ${context.summary.activeProjects}
      - Bu Ayki Gelir: ₺${context.summary.totalRevenue.toLocaleString('tr-TR')}
      - Bu Ayki Gider: ₺${context.summary.totalExpenses.toLocaleString('tr-TR')}
      - Net Kar: ₺${context.summary.netProfit.toLocaleString('tr-TR')}
      - İzin Durumu: ${context.summary.onLeaveCount} kişi izinde/yakında izne çıkacak.

      Yanıtın şu formatta olsun:
      {
        "comment": "AI yorumu buraya",
        "suggestion": "AI önerisi buraya"
      }
      Teknik bir dilden ziyade, motive edici ve akıllı bir asistan dili kullan. Türkçe olsun.
    `

        const response = await openRouter.chat.send({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'user', content: prompt }
            ],
            responseFormat: { type: 'json_object' }
        }, { headers })

        const content = response.choices[0].message.content
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
        return NextResponse.json(JSON.parse(contentStr || '{}'))
    } catch (error) {
        console.error('AI Insight Error:', error)
        return NextResponse.json({
            comment: "Şu an verileri analiz edemiyorum, ancak sistem tıkır tıkır çalışıyor! 💪",
            suggestion: "İş akışını kontrol etmeye devam edebilirsin."
        })
    }
}
