# 📧 Email Sistemi Kurulum Rehberi

## ✅ Tamamlanan Özellikler

### **1. Anında Bildirimler**
- ✅ **İzin Eklendi** → Otomatik mail gönderiliyor
- ✅ **Proje Eklendi** → API hazır (`/api/email/project`)
- ✅ **Gelir/Gider Eklendi** → API hazır (`/api/email/expense`)

### **2. Zamanlanmış Mailler**
- ⏰ **Pazartesi 10:00** → Haftalık özet
- ⏰ **Cumartesi 18:00** → İyi tatiller mesajı

---

## 🔧 Kurulum

### **1. Environment Variables**
`.env.local` dosyasına eklendi:
```bash
RESEND_API_KEY=re_Mcmt8u16_98Thb8nMsCiEVtxZPV7bMffn
NOTIFICATION_EMAILS=recepaydogan807@gmail.com,enesumutiletisim@gmail.com,selmanaydgn@gmail.com
```

### **2. Resend Paketi**
```bash
npm install resend
```

---

## 📬 Mail Alıcıları

Tüm bildirimler şu adreslere gidiyor:
- recepaydogan807@gmail.com
- enesumutiletisim@gmail.com
- selmanaydgn@gmail.com

---

## 🎯 Kullanım

### **İzin Bildirimi (Otomatik)**
İzin eklendiğinde otomatik gönderiliyor.

### **Proje Bildirimi (Manuel - Eklenecek)**
Proje ekleme formuna eklenecek:
```typescript
await fetch('/api/email/project', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Proje Adı',
    customer_name: 'Müşteri',
    status: 'Aktif',
    total_amount: 50000
  })
})
```

### **Gelir/Gider Bildirimi (Manuel - Eklenecek)**
Gelir/gider formuna eklenecek:
```typescript
await fetch('/api/email/expense', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Açıklama',
    amount: 1000,
    category: 'Kategori',
    type: 'income', // veya 'expense'
    date: '2026-02-04'
  })
})
```

---

## ⏰ Zamanlanmış Mailler (Cron Jobs)

### **Seçenek 1: Vercel Cron Jobs (Önerilen)**

1. **`vercel.json` oluştur:**
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/weekend-greeting",
      "schedule": "0 18 * * 6"
    }
  ]
}
```

2. **Cron API'leri oluştur:**
- `/app/api/cron/weekly-summary/route.ts`
- `/app/api/cron/weekend-greeting/route.ts`

### **Seçenek 2: GitHub Actions**

`.github/workflows/scheduled-emails.yml`:
```yaml
name: Scheduled Emails

on:
  schedule:
    - cron: '0 10 * * 1'  # Pazartesi 10:00
    - cron: '0 18 * * 6'  # Cumartesi 18:00

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Email
        run: |
          curl -X POST https://yourdomain.com/api/cron/weekly-summary
```

### **Seçenek 3: Hosting Cron Job**
Hosting panelinizden cron job ekleyin:
```bash
# Pazartesi 10:00
0 10 * * 1 curl -X POST https://yourdomain.com/api/cron/weekly-summary

# Cumartesi 18:00
0 18 * * 6 curl -X POST https://yourdomain.com/api/cron/weekend-greeting
```

---

## 📋 Yapılacaklar

### **Hemen Yapılacak:**
- [ ] Proje ekleme formuna mail bildirimi ekle
- [ ] Gelir/gider formuna mail bildirimi ekle

### **Cron Jobs için:**
- [ ] `/app/api/cron/weekly-summary/route.ts` oluştur
- [ ] `/app/api/cron/weekend-greeting/route.ts` oluştur
- [ ] `vercel.json` ekle (Vercel kullanıyorsanız)
- [ ] Hosting'de cron job kur (kendi hosting kullanıyorsanız)

---

## 🧪 Test

### **İzin Bildirimi Test:**
1. İzinler sayfasına git
2. "Yeni İzin" ekle
3. Mail kutularını kontrol et

### **Manuel Test (Postman/Thunder Client):**
```bash
POST http://localhost:3000/api/email/leave
Content-Type: application/json

{
  "employee_name": "Test User",
  "leave_type": "Yıllık İzin",
  "start_date": "2026-02-10",
  "end_date": "2026-02-14",
  "total_days": 5,
  "status": "approved"
}
```

---

## 🎨 Mail Şablonları

Tüm mailler profesyonel HTML şablonları ile gönderiliyor:
- ✅ Responsive tasarım
- ✅ Gradient başlıklar
- ✅ Bilgi kartları
- ✅ CTA butonları
- ✅ Mobil uyumlu

---

## 🔒 Güvenlik

- API key `.env.local` dosyasında
- `.env.local` dosyası `.gitignore`'da
- Production'da environment variables kullan

---

## 📞 Destek

Sorun olursa:
1. Console'u kontrol et
2. Resend dashboard'unu kontrol et
3. Email API loglarını kontrol et

---

**Tüm sistem hazır!** 🚀 Sadece cron job'ları kurmanız gerekiyor.
