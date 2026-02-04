# 🏖️ İzin Takip Sistemi - Kullanım Kılavuzu

## 📌 Genel Bakış

İzin Takip Sistemi, şirket çalışanlarının yıllık izin, hastalık izni ve diğer izin türlerini takip etmek için geliştirilmiş profesyonel bir web uygulamasıdır.

---

## 👥 Ekip Üyeleri

Sistemde kayıtlı ekip üyeleri:
- **Recep Aydoğan**
- **Enes Umut Parlak**
- **Selman Aydoğan**

---

## 🎯 Özellikler

### 📊 İstatistikler
Ana sayfada 4 istatistik kartı bulunur:
1. **Bu Ay Toplam İzin** - Bu ay kullanılan toplam izin günü sayısı
2. **Bugün İzinde** - Şu anda izinde olan çalışan sayısı
3. **Yaklaşan İzinler** - Önümüzdeki 30 gün içinde planlanmış izin sayısı
4. **İzin Türü Dağılımı** - İzin türlerine göre detaylı dağılım

### 📅 Takvim Görünümü
- Aylık takvim görünümü
- Önceki/sonraki ay navigasyonu
- "Bugün" butonu ile hızlı dönüş
- Renk kodlu izin türleri:
  - 🟢 **Yeşil**: Yıllık İzin
  - 🔴 **Kırmızı**: Hastalık İzni
  - 🟡 **Sarı**: Diğer
- Her gün için izinleri görüntüleme
- Bugünün tarihi mavi halka ile vurgulanır
- İzin kartlarına tıklayarak detay görüntüleme

### 📋 Liste Görünümü
- Tüm izinlerin liste halinde görünümü
- Her kayıt için:
  - Çalışan adı
  - İzin türü (badge ile)
  - Durum (badge ile)
  - Tarih aralığı
  - Toplam gün sayısı
  - Açıklama
- "Detay" butonu ile düzenleme

### 🔍 Filtreleme ve Arama
- **İsme göre arama**: Çalışan adına göre anlık arama
- **İzin türüne göre filtreleme**: Yıllık İzin, Hastalık İzni, Diğer
- **Duruma göre filtreleme**: Onaylandı, Beklemede, İptal Edildi

### 📥 CSV Export
- Tüm izin kayıtlarını CSV formatında indirme
- Excel'de açılabilir format
- Filtrelenmiş sonuçları export etme

---

## ➕ Yeni İzin Ekleme

1. Sağ üstteki **"+ Yeni İzin"** butonuna tıklayın
2. Formu doldurun:
   - **Ad Soyad**: Açılır menüden çalışan seçin
   - **İzin Türü**: Yıllık İzin, Hastalık İzni veya Diğer
   - **Başlangıç Tarihi**: Takvimden seçin
   - **Bitiş Tarihi**: Takvimden seçin
   - **Toplam Gün**: Otomatik hesaplanır (hafta sonları hariç)
   - **Durum**: Onaylandı, Beklemede veya İptal Edildi
   - **Açıklama**: İsteğe bağlı açıklama
3. **"Kaydet"** butonuna tıklayın

### 💡 İpuçları:
- Toplam gün sayısı otomatik olarak hesaplanır ve hafta sonları dahil edilmez
- Bitiş tarihi, başlangıç tarihinden önce olamaz
- Tüm alanlar zorunludur (açıklama hariç)

---

## ✏️ İzin Düzenleme

1. Takvim veya liste görünümünde bir izin kaydına tıklayın
2. Açılan dialogda bilgileri güncelleyin
3. **"Güncelle"** butonuna tıklayın

### 🗑️ İzin Silme
1. Düzenleme dialogunda sol alttaki **"Sil"** butonuna tıklayın
2. Onay dialogunda **"Sil"** butonuna tıklayın
3. İşlem geri alınamaz!

---

## 🎨 İzin Türleri

### 🏖️ Yıllık İzin
- Renk: Yeşil
- Kullanım: Planlı tatiller, dinlenme
- Emoji: 🏖️

### 🤒 Hastalık İzni
- Renk: Kırmızı
- Kullanım: Sağlık sorunları
- Emoji: 🤒

### 📋 Diğer
- Renk: Sarı
- Kullanım: Kişisel işler, acil durumlar
- Emoji: 📋

---

## 📱 Durum Türleri

- ✅ **Onaylandı**: İzin onaylanmış ve aktif
- ⏳ **Beklemede**: İzin onay bekliyor
- ❌ **İptal Edildi**: İzin iptal edilmiş

---

## 🔗 Erişim

Sisteme erişim için:
1. Tarayıcınızda `http://localhost:3000/izinler` adresine gidin
2. Sol menüden **"İzin Takibi"** seçeneğine tıklayın

---

## 🗄️ Veritabanı

### Tablo: `leave_records`
```sql
- id (UUID)
- employee_name (Text)
- leave_type (Text: 'Yıllık İzin', 'Hastalık İzni', 'Diğer')
- start_date (Date)
- end_date (Date)
- total_days (Integer)
- description (Text, nullable)
- status (Text: 'approved', 'pending', 'cancelled')
- created_at (Timestamp)
- updated_at (Timestamp)
```

---

## 🚀 Gelecek Geliştirmeler (Öneriler)

- [ ] E-posta bildirimleri
- [ ] PDF rapor export
- [ ] Yıllık izin bakiyesi takibi
- [ ] Resmi tatil günleri entegrasyonu
- [ ] Çakışan izin uyarıları
- [ ] Departman bazlı raporlama
- [ ] Mobil uygulama
- [ ] Push notification desteği

---

## 📞 Destek

Herhangi bir sorun veya öneri için lütfen sistem yöneticisi ile iletişime geçin.

---

**Son Güncelleme:** 3 Şubat 2026
**Versiyon:** 1.0.0
