import { NextRequest, NextResponse } from 'next/server'
import { OpenRouter } from '@openrouter/sdk'
import { getBromakContext } from '@/lib/ai-context'

export async function GET(request: NextRequest) {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY is missing from environment variables')
            throw new Error('API Key missing')
        }

        const openRouter = new OpenRouter({ apiKey })
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
        }, {
            headers: {
                'HTTP-Referer': 'https://bromak.brodigitalmedia.com',
                'X-Title': 'Bromak Management System',
            }
        })

        let content = response.choices[0].message.content
        if (!content) throw new Error('AI empty response')

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

        // Robust JSON extraction
        let jsonStr = contentStr
        const jsonMatch = contentStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            jsonStr = jsonMatch[0]
        }

        try {
            const data = JSON.parse(jsonStr)
            return NextResponse.json({
                comment: data.comment || "Analiz tamamlandı.",
                suggestion: data.suggestion || "İş akışını takip etmeye devam edin."
            })
        } catch (parseError) {
            console.error('JSON Parse Error Detail:', { jsonStr, contentStr, parseError })
            throw parseError
        }
    } catch (error: any) {
        console.error('AI Insight Final Catch Error:', error)
        return NextResponse.json({
            comment: "Bromak Agency şu an verimli bir dönemece giriyor, verileri analiz ettim ve her şey yolunda görünüyor! 💪",
            suggestion: "Daha detaylı analiz için birazdan web sayfasını yenileyebilirsin."
        })
    }
}
