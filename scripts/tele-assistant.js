const http = require('http');
const https = require('https');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${TOKEN}`;
const ATUS_API = 'http://localhost:3000/api/atus/live?durakNo=1658';

let lastUpdateId = 0;

console.log('--- BROMAK Bot Sanal Asistan Başlatıldı ---');
console.log('Komutlar bekleniyor: "52 nerede", "56 nerede", "durum" vb.');

/**
 * Telegram'dan gelen mesajları kontrol eder
 */
async function getUpdates() {
    return new Promise((resolve) => {
        https.get(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', () => resolve({ ok: false }));
    });
}

/**
 * Kullanıcıya cevap gönderir
 */
function sendMessage(chatId, text, messageId) {
    const body = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_to_message_id: messageId
    });

    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
        }
    };

    const req = https.request(options);
    req.write(body);
    req.end();
}

/**
 * ATUS'tan veri çekip formatlar
 */
async function getBusStatus(hatNo) {
    return new Promise((resolve) => {
        const url = `${ATUS_API}${hatNo ? `&hatlar=${hatNo}` : '&hatlar=52,56'}`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.success && json.data.length > 0) {
                        let response = `🚌 <b>Eşrefoğlu Durağı (#1658)</b>\n`;
                        json.data.forEach(bus => {
                            response += `\n<b>Hat ${bus.hatNo}:</b> ${bus.sure} (${bus.yon})`;
                            if (bus.canliIzle) response += ' 📍';
                        });
                        resolve(response);
                    } else {
                        resolve(`❌ Şu an <b>${hatNo || '52/56'}</b> hatları için aktif otobüs raporlanmadı.`);
                    }
                } catch (e) {
                    resolve('⚠️ ATUS verisi okunamadı.');
                }
            });
        }).on('error', () => resolve('Sunucuya ulaşılamadı. Dashboard açık mı?'));
    });
}

/**
 * Ana döngü
 */
async function main() {
    while (true) {
        const updates = await getUpdates();
        if (updates.ok && updates.result.length > 0) {
            for (const update of updates.result) {
                lastUpdateId = update.update_id;

                if (update.message && update.message.text) {
                    const text = update.message.text.toLowerCase();
                    const chatId = update.message.chat.id;
                    const msgId = update.message.message_id;

                    console.log(`[Mesaj] ${update.message.from.first_name}: ${text}`);

                    if (text.includes('52') && (text.includes('nerede') || text.includes('nerde') || text.length < 5)) {
                        const status = await getBusStatus('52');
                        sendMessage(chatId, status, msgId);
                    }
                    else if (text.includes('56') && (text.includes('nerede') || text.includes('nerde') || text.length < 5)) {
                        const status = await getBusStatus('56');
                        sendMessage(chatId, status, msgId);
                    }
                    else if (text.includes('durum') || text.includes('otobüsler')) {
                        const status = await getBusStatus();
                        sendMessage(chatId, status, msgId);
                    }
                }
            }
        }
        // Kısa bekleme (spam önleme)
        await new Promise(r => setTimeout(r, 500));
    }
}

main().catch(console.error);
