import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const message = body.message;
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const text = message.text.toLowerCase().trim();
        const chatId = message.chat.id;
        const msgId = message.message_id;

        // Özel Yanıt: Kurt darlandı
        if (text.includes('kurt darlandı')) {
            await sendTelegram(chatId, "meram piyasa akar 🚗, şefikcan piyasa 🚗", msgId);
            return NextResponse.json({ ok: true });
        }

        const { protocol, host } = new URL(request.url);
        const baseUrl = `${protocol}//${host}`;

        // Konfigürasyon
        const STOPS = [
            {
                id: '1658',
                name: '🏠 Eşrefoğlu',
                keywords: ['eşref', 'esref', 'ev', 'recep sıkıldı'],
                defaultLines: ['52', '56'],
                direction: 'YAZIR'
            },
            {
                id: '1635',
                name: '🏢 Adaklı',
                keywords: ['adaklı', 'adakli', 'ofis', 'is', 'iş'],
                defaultLines: ['52', '56'],
                direction: ['ÇINARALTI', 'KÜLTÜRPARK']
            },
            {
                id: '1492',
                name: '🏢 Kaşgarlı Mahmut',
                keywords: ['kaşgarlı', 'kasgarli', 'mahmut', 'ofis', 'is', 'iş'],
                defaultLines: ['52', '56', '97'],
                direction: ['ÇINARALTI', 'KÜLTÜRPARK', 'MERAM']
            }
        ];

        const ALL_LINES = ['52', '56', '97'];

        if (text.includes('kurt darlandı')) {
            await sendTelegram(chatId, "🌊 dalgalı, meram piyasa akar, şefikcan piyasa 🚀", msgId);
            return NextResponse.json({ ok: true });
        }

        // Hangi durakları ve hangi hatları istiyor?
        const reqLines = ALL_LINES.filter(line => text.includes(line));
        const reqStops = STOPS.filter(stop => stop.keywords.some(k => text.includes(k)));

        // Eğer hiçbir durak veya hat yakalanmadıysa cevap verme (Grup kalabalığı olmasın)
        if (reqLines.length === 0 && reqStops.length === 0 && !text.includes('durum') && !text.includes('nerede')) {
            return NextResponse.json({ ok: true });
        }

        // Karar Verici: 
        // 1. Durak ismi varsa sadece o durak.
        // 2. Hat no varsa her durakta o hat.
        // 3. İkisi de yoksa ama tetikleyici varsa her yer.
        const stopsToSearch = reqStops.length > 0 ? reqStops : STOPS;
        const linesToSearch = reqLines.length > 0 ? reqLines : null;

        let fullReport = `🚌 <b>Otobüs Bilgisi</b>\n`;
        let foundAny = false;

        for (const stop of stopsToSearch) {
            const currentLines = linesToSearch || stop.defaultLines;
            const url = `${baseUrl}/api/atus/live?durakNo=${stop.id}&hatlar=${currentLines.join(',')}`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.success && json.data.length > 0) {
                let stopReport = `\n📍 <b>${stop.name}</b>`;
                let foundInStop = false;

                json.data.forEach((bus: any) => {
                    const yon = bus.yon.toUpperCase();
                    const isTargetYon = Array.isArray(stop.direction)
                        ? stop.direction.some(d => yon.includes(d))
                        : yon.includes(stop.direction);

                    if (isTargetYon) {
                        stopReport += `\n- <b>Hat ${bus.hatNo}:</b> ${bus.sure} (${bus.yon})`;
                        if (bus.canliIzle) stopReport += ' 📍';
                        foundInStop = true;
                        foundAny = true;
                    }
                });

                if (foundInStop) fullReport += stopReport + `\n`;
            }
        }

        if (!foundAny) {
            fullReport = `❌ <b>${reqLines.join(', ')}</b> hattı için aktif otobüs bulunamadı.`;
        }

        await sendTelegram(chatId, fullReport, msgId);
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
