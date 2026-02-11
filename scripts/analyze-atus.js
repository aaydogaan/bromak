/**
 * ATUS API Reverse Engineering Script
 * 
 * Bu script ATUS sitesinin gerçek API endpoint'lerini tespit etmek için kullanılır.
 * Konya Belediyesi ATUS sisteminin otobüs varış saatlerini çeker.
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeAtusAPI() {
    console.log('🚌 ATUS API Analizi Başlatılıyor...\n');

    try {
        // 1. Ana sayfayı çek ve script dosyalarını analiz et
        console.log('📡 Ana sayfa yükleniyor...');
        const mainPage = await axios.get('https://atus.konya.bel.tr/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const $ = cheerio.load(mainPage.data);

        // Script dosyalarını topla
        const scripts = [];
        $('script[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) {
                scripts.push(src);
            }
        });

        console.log(`✅ ${scripts.length} adet script dosyası bulundu\n`);

        // 2. Otobüsüm Nerede sayfasını dene
        console.log('🔍 Otobüsüm Nerede sayfası kontrol ediliyor...');

        const testUrls = [
            'https://atus.konya.bel.tr/atus/otobusum-nerede',
            'https://atus.konya.bel.tr/atus/durak-bilgileri',
            'https://atus.konya.bel.tr/atus/hattaki-araclar',
        ];

        for (const url of testUrls) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                });
                console.log(`✅ ${url} - Erişilebilir (${response.status})`);
            } catch (error) {
                console.log(`❌ ${url} - Erişilemedi`);
            }
        }

        // 3. Olası API endpoint'lerini test et
        console.log('\n🔎 API Endpoint\'leri test ediliyor...');

        const apiEndpoints = [
            '/api/durak-bilgileri',
            '/api/otobus-nerede',
            '/api/hat-bilgileri',
            '/atus/api/durak',
            '/atus/api/otobus',
            '/ajax/durak-bilgileri',
            '/ajax/otobus-nerede',
        ];

        for (const endpoint of apiEndpoints) {
            try {
                const response = await axios.get(`https://atus.konya.bel.tr${endpoint}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                console.log(`✅ ${endpoint} - Bulundu! (${response.status})`);
            } catch (error) {
                // Sessizce devam et
            }
        }

        // 4. Form submission endpoint'lerini bul
        console.log('\n📝 Form endpoint\'leri aranıyor...');

        const $main = cheerio.load(mainPage.data);
        $main('form').each((i, elem) => {
            const action = $main(elem).attr('action');
            const method = $main(elem).attr('method');
            if (action) {
                console.log(`Form bulundu: ${method?.toUpperCase() || 'GET'} ${action}`);
            }
        });

        console.log('\n✨ Analiz tamamlandı!');
        console.log('\n📋 Öneriler:');
        console.log('1. ATUS sitesi muhtemelen AJAX ile veri çekiyor');
        console.log('2. Browser DevTools ile Network sekmesini incelemek gerekiyor');
        console.log('3. Durak numarası ile POST request denenmeli');

    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

// Script'i çalıştır
if (require.main === module) {
    analyzeAtusAPI();
}

module.exports = { analyzeAtusAPI };
