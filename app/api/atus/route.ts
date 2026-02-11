import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const durakNo = searchParams.get('durakNo') || '1658';

    try {
        // ATUS sitesinden durak bilgilerini çek
        const response = await fetch(`https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=${durakNo}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Sayfadaki script taglarını kontrol et
        const scripts = $('script').map((i, el) => $(el).html()).get();

        // Otobüs bilgilerini içeren veriyi bul
        let busData: any = null;

        for (const script of scripts) {
            if (script && script.includes('durakBilgileri') || script.includes('otobusler')) {
                // Script içindeki JSON verisini çıkar
                try {
                    const jsonMatch = script.match(/var\s+\w+\s*=\s*(\{[\s\S]*?\});/);
                    if (jsonMatch) {
                        busData = JSON.parse(jsonMatch[1]);
                    }
                } catch (e) {
                    console.error('JSON parse hatası:', e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            durakNo,
            data: busData,
            rawHtml: html.substring(0, 1000), // İlk 1000 karakter
        });

    } catch (error) {
        console.error('ATUS API Hatası:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}
