import { NextResponse } from 'next/server';

export async function GET() {
    // 🚫 Otomatik otobüs bildirimi devre dışı bırakıldı.
    // Bildirimler artık yalnızca Telegram'dan "ofis" veya "ev" yazıldığında gelir.
    return NextResponse.json({
        success: true,
        message: 'Disabled: Automatic bus monitor is turned off. Use the bot commands instead.'
    });
}

