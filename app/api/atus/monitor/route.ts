import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

// Son gönderilen otobüsleri takip etmek için (Spam koruması)
// Not: Serverless ortamlarda bu sıfırlanabilir, ancak local dev'de çalışır.
let lastNotifiedBuses: Record<string, number> = {};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const durakNo = '1658';
    const hatlar = '52,56';

    try {
        // İstek yapılan URL'den otomatik olarak ana adresi al (Vercel uyumu için)
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

            // 10 dakika ve altı kontrolü
            const isNear = isTargetDirection && bus.sureDakika !== null && bus.sureDakika <= 10;

            if (isNear) {
                const busKey = `${bus.hatNo}-${bus.yon}-${bus.sureDakika}`;

                // Eğer bu otobüs için son 15 dakika içinde bildirim atılmadıysa
                const now = Date.now();
                const lastTime = lastNotifiedBuses[busKey] || 0;

                // TEST: Zaman kontrolünü kaldırıyoruz, her seferinde atsın
                if (true) {
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
            notified: notifications
        });

    } catch (error) {
        console.error('Monitor hatası:', error);
        return NextResponse.json({ success: false, error: 'Monitor error' });
    }
}
