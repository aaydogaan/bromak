import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Groq API ile metin tabanlı gider analizi (Yedek Sistem)
 */
async function extractWithGroq(text: string): Promise<ExpenseExtractionResult | null> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;

  try {
    const prompt = `
      Sen bir finans asistanısın. Kullanıcının gönderdiği mesaj metninden gider (harcama) bilgilerini çıkar.
      Kullanıcı mesajı: "${text}"

      Kurallar:
      1. Kategori, kullanıcının mesajında parantez içinde belirtilmiş olabilir (örn: "(market)" veya "(Faturalar)"). Parantez yoksa metne göre en uygun kategoriyi ("Yakıt", "Market", "Faturalar", "Kira", "Yemek", "Dijital", "Maaş", "Ekipman", "Diğer") seç.
      2. Tutar mesajdan sayı olarak çıkarılmalı. (Örn: "1500 TL" veya "1.500,00" -> 1500).
      3. Tarih belirtilmişse (örn: "(16.08.2026)") YYYY-MM-DD formatında al, yoksa null ver.
      4. Çıktı sadece JSON formatında olmalı.

      JSON Şeması:
      {
        "type": "expense",
        "description": "Açıklama",
        "category": "Faturalar",
        "amount": 1500,
        "currency": "TRY",
        "date": "2026-08-16",
        "merchant": null,
        "confidence": 0.9
      }
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await res.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return JSON.parse(data.choices[0].message.content) as ExpenseExtractionResult;
    }
  } catch (err) {
    console.error("Groq fallback error:", err);
  }
  return null;
}

/**
 * Gemini AI ile Görüntü + Metin analizi
 */
export async function extractExpenseDataWithGemini(
  text: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<ExpenseExtractionResult | null> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.startsWith("AIzaSy")) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        Sen bir finans asistanısın. Dekont fotoğrafından ve mesajdan gider bilgilerini çıkar.
        Kullanıcı Mesajı: "${text}"

        Kurallar:
        1. Kategori parantez içindeyse onu al (örn: "(Market)"). Yoksa metin veya faturadan en uygun kategoriyi ("Yakıt", "Market", "Faturalar", "Kira", "Yemek", "Dijital", "Maaş", "Ekipman", "Diğer") seç.
        2. Tarih mesajda varsa onu al, yoksa dekonttaki tarihi (YYYY-MM-DD) al. Bulamazsan null yap.
        3. Tutar (amount), dekonttaki veya mesajdaki TOPLAM tutardır (Örn: 245.50).
        4. Çıktı sadece JSON formatında olmalı.

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
      return JSON.parse(responseText) as ExpenseExtractionResult;
    } catch (error) {
      console.error("Gemini OCR/AI Error:", error);
    }
  } else {
    console.warn("Geçerli bir Gemini API Key bulunamadı veya anahtar formatı hatalı.");
  }

  // Gemini başarısız olduysa veya geçerli anahtar yoksa, Groq ile metin analizi yap
  if (text) {
    console.log("Groq ile metin analizi deneniyor...");
    return await extractWithGroq(text);
  }

  return null;
}
