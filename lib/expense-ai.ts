import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ExpenseExtractionResult {
  type: string;
  description: string;
  category: string;
  amount: number | null;
  currency: string;
  date: string;
  merchant: string | null;
  confidence: number;
}

/**
 * Bu fonksiyon, Telegram'dan gelen fotoğrafı ve/veya açıklama metnini alır
 * ve Gemini AI kullanarak yapılandırılmış gider (expense) verisi çıkartır.
 * 
 * @param text Telegram kullanıcısının yazdığı mesaj/açıklama
 * @param imageBuffer Telegram'dan indirilen resim buffer'ı (varsa)
 * @param mimeType Resmin mime tipi (örn: image/jpeg)
 */
export async function extractExpenseDataWithGemini(
  text: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<ExpenseExtractionResult | null> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Sen bir finans asistanısın. Kullanıcının gönderdiği dekont fotoğrafından ve açıklama metninden gider bilgilerini çıkarman gerekiyor.
      Kullanıcının gönderdiği mesaj: "${text}"

      Kurallar:
      1. Kategori, kullanıcının mesajında parantez içinde belirtilmiş olabilir (örn: "(market)"). Eğer parantez içinde bir şey yoksa, metinden veya dekonttan en uygun kategoriyi ("Yakıt", "Market", "Faturalar", "Kira", "Yemek", "Dijital", "Maaş", "Ekipman", "Diğer") tahmin et.
      2. Tarih, mesajda belirtilmişse (örn: "(10.08.2026)") onu kullan. Belirtilmemişse faturadaki tarihi kullan. İkisi de yoksa null döndür (tarihi Telegram mesaj tarihinden biz ayarlayacağız). Tarih formatı YYYY-MM-DD olmalı.
      3. Tutar (amount), faturadaki/dekonttaki TOPLAM tutardır. Sadece sayısal değer döndür. Nokta ile ayrılmış ondalık sayı olabilir (örn: 245.50).
      4. Description, kullanıcının mesajındaki ana açıklamadır (parantez içleri ve tarihler hariç). Veya dekonttaki alışverişin kısa bir özetidir.
      5. merchant, faturayı/dekontu kesen firmanın adıdır.
      6. Çıktı kesinlikle aşağıdaki JSON şemasına uymalıdır.

      JSON Şeması:
      {
        "type": "expense",
        "description": "Kısa açıklama",
        "category": "Market",
        "amount": 150.50,
        "currency": "TRY",
        "date": "2026-08-11",
        "merchant": "Firma Adı",
        "confidence": 0.95
      }
    `;

    const parts: any[] = [{ text: prompt }];

    if (imageBuffer && mimeType) {
      parts.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType
        }
      });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Yalnızca JSON'u parse et
    const parsedData = JSON.parse(responseText) as ExpenseExtractionResult;
    return parsedData;

  } catch (error) {
    console.error("Gemini OCR/AI Error:", error);
    return null;
  }
}
