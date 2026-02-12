import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

// Son gönderilen otobüsleri takip etmek için (Spam korumasını tutan değişken)
let lastNotifiedBuses: Record<string, number> = {};

export async function GET(request: Request) {
    const durakNo = '1658';
    const hatlar = '52,56';

    try {
        const { protocol, host } = new URL(request.url);
        const baseUrl = `${protocol}//${host}`;

        const response = await fetch(`${baseUrl}/api/atus/live?durakNo=${durakNo}&hatlar=${hatlar}`, {
            cache: 'no-store'
        });
        const result = await response.json();

        if (!result.success || !result.data) {
            return NextResponse.json({ success: false, error: 'Veri çekilemedi' });
        }

        const buses = result.data;
        const notifications = [];

        for (const bus of buses) {
            // Sadece YAZIR yönüne (Eve Dönüş) gidenler için bildirim gönder
            const isTargetDirection = bus.yon && bus.yon.toUpperCase().includes('YAZIR');

            // --- ZAMAN KONTROLÜ (18:00 - 00:00) ---
            const nowTime = new Date();
            const hour = nowTime.getUTCHours() + 3; // Türkiye saati (Vercel UTC + 3)
            const trHour = hour % 24;
            const isWorkingHours = trHour >= 18 && trHour <= 23; // 18:00 - 23:59 arası

            // 10 dakika ve altı kontrolü
            const isNear = isWorkingHours && isTargetDirection && bus.sureDakika !== null && bus.sureDakika <= 10;

            if (isNear) {
                const busKey = `${bus.hatNo}-${bus.yon}-${bus.sureDakika}`;
                const now = Date.now();
                const lastTime = lastNotifiedBuses[busKey] || 0;

                // Spam koruması: 15 dakika (900.000 ms)
                if (now - lastTime > 15 * 60 * 1000) {
                    const message = `🚌 <b>Otobüs Yaklaşıyor!</b>\n\n` +
                        `<b>Hat:</b> ${bus.hatNo} - ${bus.hatAdi}\n` +
                        `<b>Yön:</b> ${bus.yon}\n` +
                        `<b>Süre:</b> ${bus.sureDakika === -1 ? 'DURAKTA' : bus.sure}\n` +
                        `<b>Durak:</b> Eşrefoğlu (#1658)`;

                    await sendTelegramMessage(message);
                    lastNotifiedBuses[busKey] = now;
                    notifications.push(busKey);
                }
            }
        }

        return NextResponse.json({
            success: true,
            checkedCount: buses.length,
            notified: notifications,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        console.error('Monitor hatası:', error);
        return NextResponse.json({ success: false, error: 'Monitor error' });
    }
}
