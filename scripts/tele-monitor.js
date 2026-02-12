const http = require('http');

/**
 * BROMAK Telegram Monitor Script
 * Bu script her 1 dakikada bir monitor API'sini çağırarak 
 * otobüs sürelerini kontrol eder ve Telegram'a bildirim atar.
 */

const ENDPOINT = 'http://localhost:3000/api/atus/monitor';
const INTERVAL = 60 * 1000; // 1 Dakika

console.log('--- ATUS Telegram Monitor Başlatıldı ---');
console.log(`Hedef: ${ENDPOINT}`);
console.log(`Periyot: ${INTERVAL / 1000} saniye`);

function checkBuses() {
    http.get(ENDPOINT, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.success) {
                    if (json.notified && json.notified.length > 0) {
                        console.log(`[${new Date().toLocaleTimeString()}] ✅ Bildirim gönderildi: ${json.notified.join(', ')}`);
                    } else {
                        // console.log(`[${new Date().toLocaleTimeString()}] Kontrol edildi, kriterlere uyan otobüs yok.`);
                    }
                } else {
                    console.error(`[${new Date().toLocaleTimeString()}] ❌ Hata: ${json.error}`);
                }
            } catch (e) {
                console.error(`[${new Date().toLocaleTimeString()}] ❌ Yanıt parse edilemedi.`);
            }
        });
    }).on('error', (err) => {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Sunucuya ulaşılamadı. (npm run dev çalışıyor mu?)`);
    });
}

// İlk kontrolü hemen yap
checkBuses();

// Periyodik kontrol
setInterval(checkBuses, INTERVAL);
