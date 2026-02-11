# ATUS Gerçek API Endpoint'ini Bulma Kılavuzu

## 🎯 Amaç

ATUS sitesinin gerçek API endpoint'ini bulmak ve otobüs verilerini çekmek.

## 🔍 Adım Adım Analiz

### 1. Browser DevTools ile Network Analizi

1. **Chrome/Edge DevTools'u Aç:**
   - F12 tuşuna bas
   - "Network" sekmesine git
   - "Preserve log" seçeneğini aktif et
   - "XHR" filtresini seç

2. **ATUS Sitesine Git:**
   ```
   https://atus.konya.bel.tr/atus/otobusum-nerede
   ```

3. **Durak Ara:**
   - Arama kutusuna "1658" yaz
   - Durak seçimini yap
   - Network sekmesinde yeni istekleri gözlemle

4. **API İsteklerini Bul:**
   - XHR/Fetch isteklerine bak
   - Request URL'i not et
   - Request Method'u not et (GET/POST)
   - Request Headers'ı not et
   - Request Payload'ı not et

### 2. Olası API Endpoint'leri

ATUS sitesi muhtemelen şu endpoint'lerden birini kullanıyor:

```
POST https://atus.konya.bel.tr/ajax/durak-bilgileri
POST https://atus.konya.bel.tr/api/otobus-nerede
POST https://atus.konya.bel.tr/atus/api/durak
GET  https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=1658
```

### 3. Request Formatı

Muhtemel POST request formatı:

```json
{
  "durakNo": "1658",
  "csrf_token": "xxxxx"
}
```

veya

```
durakNo=1658&csrf_token=xxxxx
```

### 4. CSRF Token Alma

ATUS sitesi CSRF koruması kullanıyor olabilir:

```javascript
// HTML içinden CSRF token çıkarma
const html = await fetch('https://atus.konya.bel.tr/');
const text = await html.text();
const csrfMatch = text.match(/csrf_token["\s:]+["']([^"']+)["']/i);
const csrfToken = csrfMatch ? csrfMatch[1] : null;
```

### 5. Gerçek API İsteği Örneği

DevTools'da bulduğunuz bilgilere göre:

```javascript
const response = await fetch('https://atus.konya.bel.tr/ENDPOINT_BURAYA', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0...',
  },
  body: new URLSearchParams({
    durakNo: '1658',
    csrf_token: csrfToken,
  }),
});

const data = await response.json();
console.log(data);
```

## 📊 Beklenen Response Formatı

```json
{
  "success": true,
  "durak": {
    "no": "1658",
    "adi": "Durak Adı"
  },
  "otobusler": [
    {
      "hatNo": "52",
      "hatAdi": "Karatay - Meram",
      "sure": 5,
      "mesafe": 2300,
      "plaka": "42ABC123",
      "enlem": 37.8667,
      "boylam": 32.4833
    }
  ]
}
```

## 🛠️ Alternatif Yöntemler

### Yöntem 1: HTML Scraping

Eğer API bulunamazsa, HTML'i parse edebiliriz:

```javascript
import * as cheerio from 'cheerio';

const html = await fetch('https://atus.konya.bel.tr/atus/otobusum-nerede?durakNo=1658');
const $ = cheerio.load(await html.text());

// Otobüs bilgilerini HTML'den çıkar
$('.otobus-item').each((i, elem) => {
  const hatNo = $(elem).find('.hat-no').text();
  const sure = $(elem).find('.sure').text();
  // ...
});
```

### Yöntem 2: Puppeteer ile Dinamik Scraping

```javascript
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch();
const page = await browser.newPage();

// Network isteklerini dinle
page.on('request', request => {
  if (request.url().includes('atus')) {
    console.log('Request:', request.url());
    console.log('Method:', request.method());
    console.log('Headers:', request.headers());
    console.log('PostData:', request.postData());
  }
});

await page.goto('https://atus.konya.bel.tr/atus/otobusum-nerede');
await page.type('#durak-input', '1658');
await page.click('#ara-button');

await page.waitForTimeout(2000);
await browser.close();
```

## 📝 Bulduğunuz Bilgileri Kaydetme

DevTools'da bulduğunuz bilgileri buraya not edin:

```
API Endpoint: _______________________________
Method: ____________________________________
Content-Type: ______________________________
CSRF Token Gerekli mi?: ____________________
Request Body Formatı: ______________________
Response Formatı: __________________________
```

## 🔄 API'yi Entegre Etme

Bilgileri bulduktan sonra `app/api/atus/live/route.ts` dosyasını güncelleyin:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const durakNo = searchParams.get('durakNo') || '1658';

  // 1. CSRF token al
  const csrfToken = await getCsrfToken();

  // 2. ATUS API'sine istek at
  const response = await fetch('GERÇEK_ENDPOINT_BURAYA', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: new URLSearchParams({
      durakNo,
      csrf_token: csrfToken,
    }),
  });

  const data = await response.json();

  // 3. Veriyi parse et ve döndür
  return NextResponse.json({
    success: true,
    data: parseAtusData(data),
  });
}
```

## ⚠️ Önemli Notlar

1. **Rate Limiting:** ATUS sitesine çok sık istek atmayın (max 1 istek/saniye)
2. **User-Agent:** Gerçek bir browser User-Agent kullanın
3. **Cookies:** Session cookie'leri gerekebilir
4. **IP Blocking:** Çok fazla istek atarsanız IP'niz engellenebilir
5. **Yasal:** ATUS verilerini kullanmadan önce izin alın

## 🎓 Öğrenme Kaynakları

- [Chrome DevTools Network Analizi](https://developer.chrome.com/docs/devtools/network/)
- [Reverse Engineering Web APIs](https://www.youtube.com/results?search_query=reverse+engineering+web+api)
- [Puppeteer Documentation](https://pptr.dev/)

---

**İyi şanslar! 🚀**
