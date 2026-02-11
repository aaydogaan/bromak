import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * ATUS Canlı Otobüs Takip API
 *
 * Konya Büyükşehir Belediyesi ATUS sisteminden gerçek zamanlı otobüs verilerini çeker.
 *
 * Çalışma Mantığı:
 * 1. Önce environment variable'lardan veya otomatik session ile cookie alınır
 * 2. otobusum-nerede-liste-getir endpoint'ine POST isteği atılarak veriler çekilir
 * 3. Gelen HTML tablo verileri Cheerio ile parse edilir ve JSON olarak döndürülür
 *
 * Cloudflare koruması nedeniyle otomatik session alamıyorsa,
 * .env.local dosyasına ATUS_COOKIES ve ATUS_CSRF_TOKEN eklenmelidir.
 */

interface BusArrival {
    hatNo: string;
    hatHarf: string;
    hatAdi: string;
    sure: string;
    sureDakika: number;
    yon: string;
    canliIzle: boolean;
    hatKodu: string;
}

// Cookie ve session bilgilerini tutacak cache
let sessionCache: {
    cookies: string;
    csrfToken: string;
    timestamp: number;
} | null = null;

const SESSION_TTL = 10 * 60 * 1000; // 10 dakika

/**
 * ATUS session bilgilerini al (env veya otomatik)
 */
async function getAtusSession(): Promise<{ cookies: string; csrfToken: string }> {
    // 1. Önce .env.local'dan dene
    const envCookies = process.env.ATUS_COOKIES;
    const envCsrf = process.env.ATUS_CSRF_TOKEN;

    if (envCookies && envCsrf) {
        return { cookies: envCookies, csrfToken: envCsrf };
    }

    // 2. Cache kontrolü
    if (sessionCache && Date.now() - sessionCache.timestamp < SESSION_TTL) {
        return { cookies: sessionCache.cookies, csrfToken: sessionCache.csrfToken };
    }

    // 3. Otomatik session al
    console.log('🔑 ATUS: Yeni session alınıyor...');

    try {
        const response = await fetch('https://atus.konya.bel.tr/atus/otobusum-nerede', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9',
            },
            redirect: 'follow',
        });

        // Set-Cookie header'larından cookie'leri çıkar
        const setCookieHeader = response.headers.get('set-cookie') || '';
        const cookieMap: Record<string, string> = {};

        // set-cookie'leri parse et
        const cookieParts = setCookieHeader.split(/,(?=\s*\w+=)/);
        for (const part of cookieParts) {
            const [nameValue] = part.split(';');
            if (nameValue) {
                const eqIndex = nameValue.indexOf('=');
                if (eqIndex > 0) {
                    const name = nameValue.substring(0, eqIndex).trim();
                    const value = nameValue.substring(eqIndex + 1).trim();
                    cookieMap[name] = value;
                }
            }
        }

        const csrfToken = cookieMap['ATUS_ANCOOK1'] || '';
        const cookieString = Object.entries(cookieMap)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');

        await response.text(); // body'i tüket

        sessionCache = { cookies: cookieString, csrfToken, timestamp: Date.now() };
        console.log(`✅ ATUS Session alındı. CSRF: ${csrfToken ? 'var' : 'yok'}`);

        return { cookies: cookieString, csrfToken };
    } catch (error) {
        console.error('❌ Otomatik session alınamadı:', error);
        throw new Error('ATUS session alınamadı. Lütfen .env.local dosyasına ATUS_COOKIES ve ATUS_CSRF_TOKEN ekleyin.');
    }
}

/**
 * HTML tablodan otobüs verilerini parse eder
 */
function parseAtusHtml(htmlContent: string, filterHatlar?: string[]): BusArrival[] {
    const $ = cheerio.load(`<table>${htmlContent}</table>`);
    const buses: BusArrival[] = [];

    $('tr').each((_, row) => {
        const $row = $(row);

        // Hat numarası ve harfi: "52 - A", "56 - A"
        const hatBadge = $row.find('.tdHatno .badge').text().trim();
        const hatParts = hatBadge.split('-').map(s => s.trim());
        const hatNo = hatParts[0] || '';
        const hatHarf = hatParts[1] || 'A';

        // Hat adı
        const hatAdi = $row.find('.tdAdi').text().trim();

        // Süre
        const sureTd = $row.find('.tdSure').text().trim();

        // Yön
        const yon = $row.find('.tdYon').text().trim();

        // Canlı izle kontrolü (btn-danger = canlı, btn-warning = tarife)
        const $btn = $row.find('.tdDurum input');
        const canliIzle = $btn.hasClass('btn-danger');

        // Hat kodu (onclick'ten)
        const onclick = $btn.attr('onclick') || '';
        const hatKoduMatch = onclick.match(/harita=([^'&"]+)/) || onclick.match(/tarife=([^'&"]+)/);
        const hatKodu = hatKoduMatch?.[1] || `${hatNo}-0`;

        // Süreyi dakikaya çevir
        let sureDakika = 0;
        const sureText = sureTd.toLowerCase();
        if (sureText.includes('durakta')) {
            sureDakika = -1; // Durakta!
        } else {
            const match = sureText.match(/(\d+)\s*dk/);
            if (match) {
                sureDakika = parseInt(match[1]);
            }
        }

        if (hatNo) {
            buses.push({
                hatNo,
                hatHarf,
                hatAdi,
                sure: sureTd || 'Tarife',
                sureDakika,
                yon,
                canliIzle,
                hatKodu,
            });
        }
    });

    // Filtre uygula
    if (filterHatlar && filterHatlar.length > 0) {
        return buses.filter(bus => filterHatlar.includes(bus.hatNo));
    }

    return buses;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const durakNo = searchParams.get('durakNo') || '1658';
    const hatlarParam = searchParams.get('hatlar');
    const filterHatlar = hatlarParam ? hatlarParam.split(',') : undefined;

    try {
        const { cookies, csrfToken } = await getAtusSession();

        const response = await fetch('https://atus.konya.bel.tr/atus/otobusum-nerede-liste-getir', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://atus.konya.bel.tr',
                'Referer': `https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=${durakNo}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0',
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': cookies,
            },
            body: `durakNo=${durakNo}&ATUS_ANC5RFA=${csrfToken}`,
        });

        if (!response.ok) {
            sessionCache = null;
            throw new Error(`ATUS API hata döndürdü: ${response.status}`);
        }

        const data = await response.json();

        if (!data.veriTablo) {
            sessionCache = null;
            throw new Error('ATUS verisi alınamadı - session geçersiz olabilir');
        }

        const buses = parseAtusHtml(data.veriTablo, filterHatlar);

        return new NextResponse(JSON.stringify({
            success: true,
            durakNo,
            timestamp: new Date().toISOString(),
            toplamOtobus: buses.length,
            data: buses,
            uyari: data.uyari,
        }), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('❌ ATUS API Hatası:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            durakNo,
            timestamp: new Date().toISOString(),
            ipucu: 'Cloudflare koruması nedeniyle cookie gerekebilir. .env.local dosyasına ATUS_COOKIES ve ATUS_CSRF_TOKEN ekleyin.',
        }, { status: 500 });
    }
}
