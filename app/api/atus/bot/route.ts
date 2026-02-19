import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const message = body.message;
        
        // Eğer mesaj yoksa veya sadece bir start komutuysa menüyü gönder
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const text = message.text.toLowerCase().trim();
        const chatId = message.chat.id;
        const msgId = message.message_id;

        const { protocol, host } = new URL(request.url);
        const baseUrl = `${protocol}//${host}`;

        // --- 1. ÖZEL KOMUTLAR (Eğlence) ---
        if (text.includes('kurt darlandı')) {
            await sendTelegram(chatId, "dalgalı, meram piyasa akar, şefikcan piyasa", msgId);
            return NextResponse.json({ ok: true });
        }
        if (text.includes('enes sıkıldı')) {
            await sendTelegram(chatId, "Otur çalış sana piyasa yok", msgId);
            return NextResponse.json({ ok: true });
        }

        // --- 2. DURAK KONFİGÜRASYONU ---
        const STOPS = [
            { 
                id: '1658', 
                name: '🏠 Eşrefoğlu (Ev)', 
                keywords: ['eşref', 'ev', 'recep sıkıldı', '🏠 ev'], 
                defaultLines: ['52', '56'], 
                direction: 'YAZIR' 
            },
            { 
                id: '1635', 
                name: '🏢 Adaklı (Ofis)', 
                keywords: ['adaklı', 'ofis', '🏢 ofis'], 
                defaultLines: ['52', '56'], 
                direction: ['ÇINARALTI', 'KÜLTÜRPARK'] 
            },
            { 
                id: '1492', 
                name: '🏢 Kaşgarlı Mahmut (Ofis)', 
                keywords: ['kaşgarlı', 'mahmut', 'ofis', '🏢 ofis'], 
                defaultLines: ['52', '56', '97'], 
                direction: ['ÇINARALTI', 'KÜLTÜRPARK', 'MERAM'] 
            }
        ];

        // --- 3. MENÜ İSTEĞİ (/start veya menü yazınca) ---
        if (text === '/start' || text === 'menü' || text === 'butonlar') {
            await sendMenu(chatId);
            return NextResponse.json({ ok: true });
        }

        // --- 4. ARAÇ SORGULAMA ---
        const reqLines = ['52', '56', '97'].filter(line => text.includes(line));
        const reqStops = STOPS.filter(stop => stop.keywords.some(k => text.includes(k)));

        // Eğer hiçbir durak veya hat yakalanmadıysa cevap verme
        if (reqLines.length === 0 && reqStops.length === 0 && !text.includes('durum')) {
            return NextResponse.json({ ok: true });
        }

        const stopsToSearch = reqStops.length > 0 ? reqStops : STOPS.filter(s => reqLines.some(l => s.defaultLines.includes(l)));
        const finalStops = stopsToSearch.length > 0 ? stopsToSearch : STOPS;

        let fullReport = `🚌 <b>Otobüs Bilgisi</b>\n`;
        let foundAny = false;

        for (const stop of finalStops) {
            const currentLines = reqLines.length > 0 ? reqLines : stop.defaultLines;
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
            fullReport = `❌ Seçilen kriterler için aktif otobüs bulunamadı.`;
        }

        await sendTelegram(chatId, fullReport, msgId);
        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}

// Menü/Butonları gönderen fonksiyon
async function sendMenu(chatId: number) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const keyboard = {
        keyboard: [
            [{ text: '🏠 Ev' }, { text: '🏢 Ofis' }],
            [{ text: '52' }, { text: '56' }, { text: '97' }],
            [{ text: '🚀 Durum' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: "👋 <b>BROMAK Otobüs Asistanına Hoş Geldin!</b>\n\nAlttaki menüden sorgulama yapabilirsin.",
            parse_mode: 'HTML',
            reply_markup: keyboard
        })
    });
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
