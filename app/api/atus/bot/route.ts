import { NextResponse } from 'next/server';

// ─── DURAK KONFİGÜRASYONU ────────────────────────────────────────────────────
const STOPS = [
    {
        id: '1658',
        name: '🏠 Eşrefoğlu (Ev)',
        keywords: ['eşref', 'ev', 'recep sıkıldı', '🏠 ev'],
        defaultLines: ['52', '56'],
        direction: 'YAZIR',
        callbackKey: 'ev'
    },
    {
        id: '1635',
        name: '🏢 Adaklı (Ofis)',
        keywords: ['adaklı', 'ofis', '🏢 ofis'],
        defaultLines: ['52', '56'],
        direction: ['ÇINARALTI', 'KÜLTÜRPARK'],
        callbackKey: 'ofis'
    },
    {
        id: '1492',
        name: '🏢 Kaşgarlı Mahmut (Ofis2)',
        keywords: ['kaşgarlı', 'mahmut'],
        defaultLines: ['52', '56', '97'],
        direction: ['ÇINARALTI', 'KÜLTÜRPARK', 'MERAM'],
        callbackKey: 'ofis2'
    },
];

// ─── OTOBÜs SORGU MOTORU ─────────────────────────────────────────────────────
async function queryBuses(stopKeys: string[], baseUrl: string): Promise<{ text: string; activeKey: string }> {
    const targetStops = stopKeys.length > 0
        ? STOPS.filter(s => stopKeys.includes(s.callbackKey))
        : STOPS;

    let fullReport = `🚌 <b>Otobüs Bilgisi</b>\n`;
    let foundAny = false;

    for (const stop of targetStops) {
        const url = `${baseUrl}/api/atus/live?durakNo=${stop.id}&hatlar=${stop.defaultLines.join(',')}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();

        if (json.success && json.data.length > 0) {
            let stopReport = `\n📍 <b>${stop.name}</b>`;
            let foundInStop = false;

            json.data.forEach((bus: any) => {
                const yon = bus.yon.toUpperCase();
                const isTargetYon = Array.isArray(stop.direction)
                    ? stop.direction.some((d: string) => yon.includes(d))
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
        fullReport = `❌ Aktif otobüs bulunamadı. Biraz sonra tekrar dene.`;
    }

    // Güncellenme zamanını sona ekle
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Istanbul' });
    fullReport += `\n<i>🕐 ${timeStr} itibarıyla</i>`;

    return { text: fullReport, activeKey: stopKeys[0] || 'ev' };
}

// ─── WEBHOOK HANDLER ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const token = process.env.TELEGRAM_BOT_TOKEN!;
        const { protocol, host } = new URL(request.url);
        const baseUrl = `${protocol}//${host}`;

        // ── NORMAL MESAJ ──────────────────────────────────────────────────────
        const message = body.message;
        if (!message || !message.text) return NextResponse.json({ ok: true });

        const text = message.text.toLowerCase().trim();
        const chatId = message.chat.id;
        const msgId = message.message_id;

        // --- ÖZEL KOMUTLAR (Eğlence) ---
        if (text.includes('kurt darlandı')) {
            await sendTelegram(token, chatId, 'dalgalı, meram piyasa akar, şefikcan piyasa', msgId);
            return NextResponse.json({ ok: true });
        }
        if (text.includes('enes sıkıldı')) {
            await sendTelegram(token, chatId, 'Otur çalış sana piyasa yok', msgId);
            return NextResponse.json({ ok: true });
        }

        // --- MENÜ (/start veya menü yazınca) ---
        if (text === '/start' || text === 'menü' || text === 'butonlar') {
            await sendMenu(token, chatId);
            return NextResponse.json({ ok: true });
        }

        // --- HANGİ DURAĞA SORGU? ---
        const reqLines = ['52', '56', '97'].filter(line => text.includes(line));
        const reqStops = STOPS.filter(stop => stop.keywords.some(k => text.includes(k)));

        // Hiçbir anahtar kelime yoksa sessiz kal
        if (reqLines.length === 0 && reqStops.length === 0 && !text.includes('durum')) {
            return NextResponse.json({ ok: true });
        }

        // Hangi duraklara bakacağız?
        let targetStopKeys: string[] = [];
        if (reqStops.length > 0) {
            targetStopKeys = reqStops.map(s => s.callbackKey);
        } else if (reqLines.length > 0) {
            targetStopKeys = STOPS
                .filter(s => reqLines.some(l => s.defaultLines.includes(l)))
                .map(s => s.callbackKey);
        }

        // Veriyi çek ve düz metin olarak gönder
        const { text: reportText } = await queryBuses(targetStopKeys, baseUrl);

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: reportText,
                parse_mode: 'HTML',
                reply_to_message_id: msgId,
            }),
        });

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ ok: true });
    }
}

// ─── YARDIMCI FONKSİYONLAR ───────────────────────────────────────────────────

// Altta sabit klavye menüsü (sadece /start veya "menü" yazınca)
async function sendMenu(token: string, chatId: number) {
    const keyboard = {
        keyboard: [
            [{ text: '🏠 Ev' }, { text: '🏢 Ofis' }],
            [{ text: '52' }, { text: '56' }, { text: '97' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    };

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: '👋 <b>BROMAK Otobüs Asistanı</b>\n\nAşağıdaki butonları kullanabilir veya <b>ev</b> / <b>ofis</b> yazabilirsin.',
            parse_mode: 'HTML',
            reply_markup: keyboard,
        }),
    });
}

// Düz metin yanıtı (eğlence komutları için)
async function sendTelegram(token: string, chatId: number, text: string, replyId: number) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_to_message_id: replyId,
        }),
    });
}
