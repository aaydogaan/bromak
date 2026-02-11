# ATUS Otobüs Takip Sistemi - Kurulum Kılavuzu

## 📋 Genel Bakış

Bu proje, Konya Büyükşehir Belediyesi ATUS (Akıllı Toplu Ulaşım Sistemleri) verilerini kullanarak 52 ve 56 numaralı otobüslerin 1658 numaralı duraktaki canlı varış sürelerini gösterir.

## 🚀 Özellikler

- ✅ Canlı otobüs takibi (30 saniyede bir otomatik güncelleme)
- ✅ 52 ve 56 numaralı hatlar için özel filtreleme
- ✅ Dakika bazında varış süreleri
- ✅ Mesafe bilgisi
- ✅ Plaka bilgisi
- ✅ Responsive tasarım
- ✅ Modern UI/UX

## 📁 Proje Yapısı

```
c:\bromak\
├── app/
│   ├── api/
│   │   └── atus/
│   │       ├── route.ts          # Temel ATUS API
│   │       └── live/
│   │           └── route.ts      # Canlı otobüs takip API
│   └── atus-test/
│       └── page.tsx              # ATUS test sayfası
├── scripts/
│   └── analyze-atus.js           # ATUS API analiz scripti
└── ATUS_KURULUM.md              # Bu dosya
```

## 🔧 Kurulum

### 1. Bağımlılıkları Kontrol Et

Projenizde zaten yüklü olan paketler:
- `cheerio` - HTML parsing için
- `next` - Framework
- `react` - UI library
- `lucide-react` - İkonlar

### 2. Sayfayı Görüntüle

Tarayıcınızda şu adresi açın:
```
http://localhost:3000/atus-test
```

### 3. API Endpoint'leri

#### Canlı Veri API
```
GET /api/atus/live?durakNo=1658&hatlar=52,56
```

**Parametreler:**
- `durakNo` (string): Durak numarası (varsayılan: 1658)
- `hatlar` (string): Virgülle ayrılmış hat numaraları (varsayılan: 52,56)

**Örnek Response:**
```json
{
  "success": true,
  "durakNo": "1658",
  "timestamp": "2026-02-11T12:30:00.000Z",
  "data": [
    {
      "hatNo": "52",
      "hatAdi": "Karatay - Meram",
      "sure": 5,
      "mesafe": "2.3 km",
      "plaka": "42 ABC 123",
      "gercekZamanli": false
    },
    {
      "hatNo": "56",
      "hatAdi": "Selçuklu - Merkez",
      "sure": 12,
      "mesafe": "4.1 km",
      "plaka": "42 XYZ 456",
      "gercekZamanli": false
    }
  ],
  "meta": {
    "source": "mock",
    "csrfToken": "found",
    "hatlar": ["52", "56"]
  }
}
```

## 🔍 ATUS API Reverse Engineering

### Mevcut Durum

ATUS sitesi (`https://atus.konya.bel.tr`) şu anda:
- JavaScript ile dinamik veri yüklüyor
- Muhtemelen AJAX/Fetch ile backend'e istek atıyor
- CSRF token kullanıyor olabilir

### Gerçek API'yi Bulmak İçin

1. **Browser DevTools Kullanımı:**
   - Chrome/Edge DevTools'u açın (F12)
   - Network sekmesine gidin
   - https://atus.konya.bel.tr/atus/otobusum-nerede sayfasını açın
   - Durak numarası girin ve arama yapın
   - XHR/Fetch isteklerini inceleyin

2. **Analiz Scripti Çalıştırma:**
   ```bash
   node scripts/analyze-atus.js
   ```

### Bulunması Gereken Bilgiler

- [ ] API endpoint URL'i
- [ ] Request method (GET/POST)
- [ ] Request headers
- [ ] Request body formatı
- [ ] CSRF token alma yöntemi
- [ ] Response formatı

## 🎨 Özelleştirme

### Farklı Durak Kullanmak

`app/atus-test/page.tsx` dosyasında:
```typescript
const durakNo = '1658'; // Buraya kendi durak numaranızı yazın
```

### Farklı Hatlar Eklemek

```typescript
const targetBuses = ['52', '56', '23', '45']; // İstediğiniz hatları ekleyin
```

### Güncelleme Aralığını Değiştirmek

```typescript
const interval = setInterval(fetchBusData, 30000); // 30000 = 30 saniye
```

## 🐛 Sorun Giderme

### API Hatası Alıyorum

1. ATUS sitesinin erişilebilir olduğundan emin olun
2. CORS hatası varsa, Next.js API route'ları kullanıyoruz (CORS sorunu olmamalı)
3. Console'da hata mesajlarını kontrol edin

### Veri Güncellenmiyor

1. Network sekmesinde API çağrılarını kontrol edin
2. 30 saniye bekleyin (otomatik güncelleme için)
3. Manuel olarak "Yenile" butonuna basın

### Mock Data Gösteriyor

Şu anda gerçek ATUS API'si entegre edilmediği için mock data gösteriliyor. Gerçek API endpoint'i bulunduğunda `app/api/atus/live/route.ts` dosyası güncellenecek.

## 📝 Sonraki Adımlar

1. **ATUS API Endpoint'ini Bul:**
   - Browser DevTools ile network trafiğini analiz et
   - Gerçek API endpoint'ini tespit et

2. **API Entegrasyonu:**
   - `app/api/atus/live/route.ts` dosyasını güncelle
   - Gerçek ATUS API'sine istek at
   - Response'u parse et

3. **Veri Doğrulama:**
   - Gerçek verilerle test et
   - Hata durumlarını handle et

4. **Optimizasyon:**
   - Caching ekle
   - Rate limiting uygula
   - Error handling iyileştir

## 🔐 Güvenlik Notları

- ATUS sitesinin kullanım şartlarına uyun
- Rate limiting uygulayın (çok sık istek atmayın)
- API key gerekiyorsa environment variable kullanın
- CORS politikalarına dikkat edin

## 📞 Destek

Sorularınız için:
- ATUS Resmi Site: https://atus.konya.bel.tr
- Konya Büyükşehir Belediyesi: https://www.konya.bel.tr

## 📄 Lisans

Bu proje eğitim amaçlıdır. ATUS verilerinin kullanımı için Konya Büyükşehir Belediyesi'nin izni gerekebilir.

---

**Son Güncelleme:** 11 Şubat 2026
**Versiyon:** 1.0.0
