import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const message = body.message;
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const text = message.text.toLowerCase();
        const chatId = message.chat.id;
        const msgId = message.message_id;

        // Dashboard URL'ini belirle
        const { protocol, host } = new URL(request.url);
        const baseUrl = `${protocol}//${host}`;

        // Triggers
        const isStatusRequest = text.includes('durum') || text.includes('nerede') || text.includes('nerde') || text.includes('otobüs') || text.includes('hepsi');

        if (isStatusRequest) {
            const stops = [
                { id: '1658', name: '🏠 Eşrefoğlu', filters: ['52', '56'], direction: 'YAZIR' },
                { id: '1635', name: '🏢 Adaklı', filters: ['52', '56'], direction: ['ÇINARALTI', 'KÜLTÜRPARK'] },
                { id: '1492', name: '🏢 Kaşgarlı Mahmut', filters: ['52', '56', '97'], direction: ['ÇINARALTI', 'KÜLTÜRPARK', 'MERAM'] }
            ];

            let fullReport = `🚌 <b>Güncel Otobüs Durumları</b>\n`;

            for (const stop of stops) {
                const url = `${baseUrl}/api/atus/live?durakNo=${stop.id}&hatlar=${stop.filters.join(',')}`;
                const res = await fetch(url);
                const json = await res.json();

                if (json.success && json.data.length > 0) {
                    let stopReport = `\n📍 <b>${stop.name}</b>`;
                    let found = false;

                    json.data.forEach((bus: any) => {
                        const yon = bus.yon.toUpperCase();
                        const isTarget = Array.isArray(stop.direction)
                            ? stop.direction.some(d => yon.includes(d))
                            : yon.includes(stop.direction);

                        if (isTarget) {
                            stopReport += `\n- <b>Hat ${bus.hatNo}:</b> ${bus.sure} (${bus.yon})`;
                            if (bus.canliIzle) stopReport += ' 📍';
                            found = true;
                        }
                    });

                    if (found) fullReport += stopReport + `\n`;
                }
            }

            if (fullReport === `🚌 <b>Güncel Otobüs Durumları</b>\n`) {
                fullReport = `❌ Takip edilen hatlar için şu an aktif otobüs bulunamadı.`;
            }

            await sendTelegram(chatId, fullReport, msgId);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}

async function sendTelegram(chatId: number, text: string, replyId: number) {
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
