/**
 * Telegram Mesaj Servisi
 */
export async function sendTelegramMessage(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || token === 'xxxx') {
        console.warn('Telegram Bot Token veya Chat ID eksik/hatalı.');
        return { success: false, error: 'Config missing' };
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }),
        });

        const data = await response.json();
        return { success: data.ok, data };
    } catch (error) {
        console.error('Telegram gönderim hatası:', error);
        return { success: false, error };
    }
}
