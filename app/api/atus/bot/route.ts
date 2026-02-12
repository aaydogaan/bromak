import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Telegram'dan gelen mesaj içeriği
        const message = body.message;
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const text = message.text.toLowerCase();
        const chatId = message.chat.id;
        const msgId = message.message_id;

        // Dashboard URL'ini belirle
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl && process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
        }
        if (!baseUrl) {
            baseUrl = 'http://localhost:3000'; // Fallback
        }

        // Atus verisini çek
        if (text.includes('52') || text.includes('56') || text.includes('otobüs') || text.includes('durum')) {
            let hat = '';
            if (text.includes('52')) hat = '52';
            else if (text.includes('56')) hat = '56';

            const url = `${baseUrl}/api/atus/live?durakNo=1658${hat ? `&hatlar=${hat}` : '&hatlar=52,56'}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.success && json.data.length > 0) {
                let responseText = `🚌 <b>Eşrefoğlu Durağı (#1658)</b>\n`;
                json.data.forEach((bus: any) => {
                    responseText += `\n<b>Hat ${bus.hatNo}:</b> ${bus.sure} (${bus.yon})`;
                    if (bus.canliIzle) responseText += ' 📍';
                });

                await sendTelegramMessageWithReply(chatId, responseText, msgId);
            } else {
                await sendTelegramMessageWithReply(chatId, `❌ Şu an aktif otobüs raporlanmadı.`, msgId);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true }); // Telegram'a hata dönme ki tekrar tekrar göndermesin
    }
}

// Lokal fonksiyon (reply desteği için)
async function sendTelegramMessageWithReply(chatId: number, text: string, replyId: number) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            reply_to_message_id: replyId
        })
    });
}
