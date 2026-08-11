import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractExpenseDataWithGemini, ExpenseExtractionResult } from "@/lib/expense-ai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8476885653:AAGWAH4FToBa9ehjwvCTO_idyTlSXsg0ncY";
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || "-5249730279";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Vercel Serverless ortamında yazılabilir geçici klasör (os.tmpdir()) kullanılır
const CACHE_DIR = path.join(os.tmpdir(), "telegram_cache");
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (e) {
  console.error("Cache dir creation error:", e);
}

function savePendingExpense(id: string, data: any) {
  fs.writeFileSync(path.join(CACHE_DIR, `${id}.json`), JSON.stringify(data));
}

function getPendingExpense(id: string) {
  const filePath = path.join(CACHE_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

function deletePendingExpense(id: string) {
  const filePath = path.join(CACHE_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    }),
  });
}

async function getTelegramFile(fileId: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok) return null;
  
  const filePath = data.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  
  const fileRes = await fetch(downloadUrl);
  const arrayBuffer = await fileRes.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), path: filePath };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Callback Query (Kullanıcı Butona Bastıysa) İşlemi
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data; // Örn: confirm_12345 veya cancel_12345

      if (String(chatId) !== String(ALLOWED_CHAT_ID)) {
        return NextResponse.json({ ok: true });
      }

      const [action, id] = data.split("_");
      if (action === "confirm") {
        const pendingData = getPendingExpense(id);
        if (!pendingData) {
          await sendTelegramMessage(chatId, "⚠️ İstek zaman aşımına uğramış veya bulunamadı.");
          return NextResponse.json({ ok: true });
        }

        // Veritabanına kaydet
        const { error } = await supabase.from("expenses").insert({
          category: pendingData.category,
          amount: pendingData.amount,
          description: pendingData.description,
          date: pendingData.date,
          attachment_url: pendingData.attachmentUrl,
          telegram_message_id: pendingData.telegramMessageId
        });

        if (error) {
          console.error("DB Error:", error);
          if (error.code === '23505') { // Unique violation
            await sendTelegramMessage(chatId, "⚠️ Bu gider daha önce kaydedilmiş (Çift Kayıt).");
          } else {
            await sendTelegramMessage(chatId, "❌ Kayıt sırasında veritabanı hatası oluştu.");
          }
        } else {
          // Tarihi Türkiye formatında göster (DD.MM.YYYY)
          const displayDate = pendingData.date.split("-").reverse().join(".");
          await sendTelegramMessage(chatId, `✅ Gider başarıyla eklendi!\n\n💰 Tutar: ${pendingData.amount} TL\n📝 Açıklama: ${pendingData.description}\n📁 Kategori: ${pendingData.category}\n📅 Tarih: ${displayDate}`);
        }
        deletePendingExpense(id);

      } else if (action === "cancel") {
        await sendTelegramMessage(chatId, "❌ İşlem iptal edildi.");
        deletePendingExpense(id);
      }

      // Answer callback query to remove loading state
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery?callback_query_id=${callbackQuery.id}`);
      return NextResponse.json({ ok: true });
    }

    // 2. Normal Mesaj İşlemi
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      let messageText = message.caption || message.text || "";

      if (String(chatId) !== String(ALLOWED_CHAT_ID)) {
        // Eğer kullanıcı ID öğrenmek için bir şey yazdıysa bot cevap versin
        if (messageText.includes("id")) {
           await sendTelegramMessage(chatId, `Bu grubun (veya sohbetin) ID'si: <b>${chatId}</b>\n\nBu ID'yi .env.local dosyanızdaki TELEGRAM_ALLOWED_CHAT_ID bölümüne yapıştırabilirsiniz.`);
        }
        return NextResponse.json({ ok: true });
      }

      const messageId = message.message_id;
      const telegramMessageIdStr = `${chatId}_${messageId}`;

      // Eğer sistemde daha önce işlenmişse, işlem yapma
      const { data: existingData } = await supabase
        .from("expenses")
        .select("id")
        .eq("telegram_message_id", telegramMessageIdStr)
        .single();
        
      if (existingData) {
        await sendTelegramMessage(chatId, "⚠️ Bu dekont zaten işlenmiş.");
        return NextResponse.json({ ok: true });
      }

      // Fotoğraf var mı kontrolü
      let imageBuffer: Buffer | undefined;
      let mimeType: string | undefined;
      let attachmentUrl = "";

      if (message.photo && message.photo.length > 0) {
        // En yüksek çözünürlüklü olanı al (dizinin sonundaki)
        const photo = message.photo[message.photo.length - 1];
        const fileData = await getTelegramFile(photo.file_id);
        if (fileData) {
          imageBuffer = fileData.buffer;
          mimeType = "image/jpeg"; // Telegram fotoları genelde jpeg'dir

          // Supabase Storage'a Yükleme
          const fileName = `tg_${Date.now()}_${photo.file_id}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("expenses")
            .upload(`expenses/${fileName}`, imageBuffer, { contentType: "image/jpeg" });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("expenses")
              .getPublicUrl(`expenses/${fileName}`);
            attachmentUrl = publicUrl;
          }
        }
      } else if (message.document) {
         const doc = message.document;
         const isImage = doc.mime_type?.startsWith("image/");
         const isPdf = doc.mime_type === "application/pdf";

         if (isImage || isPdf) {
            const fileData = await getTelegramFile(doc.file_id);
            if (fileData) {
              imageBuffer = isImage ? fileData.buffer : undefined;
              mimeType = doc.mime_type;
              
              // Eğer PDF ise içerisindeki metni oku (pdf-parse v1 ve v2 uyumlu)
              if (isPdf) {
                 try {
                    const pdfModule = require("pdf-parse");
                    let pdfText = "";

                    if (pdfModule.PDFParse) {
                       // pdf-parse v2 (Mehmet Kozan)
                       const parser = new pdfModule.PDFParse({ data: fileData.buffer });
                       const parsed = await parser.getText();
                       pdfText = parsed.text || "";
                    } else if (typeof pdfModule === "function") {
                       // pdf-parse v1 (Classic)
                       const parsed = await pdfModule(fileData.buffer);
                       pdfText = parsed.text || "";
                    }

                    if (pdfText) {
                       messageText = (messageText ? messageText + "\n" : "") + "PDF Dekont İçeriği:\n" + pdfText;
                    }
                 } catch (pdfErr) {
                    console.error("PDF okuma hatası:", pdfErr);
                 }
              }

              const ext = isPdf ? ".pdf" : "";
              const fileName = `tg_${Date.now()}_${doc.file_id}${ext}`;
              const { error: uploadError } = await supabase.storage
                .from("expenses")
                .upload(`expenses/${fileName}`, fileData.buffer, { contentType: mimeType });

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from("expenses")
                  .getPublicUrl(`expenses/${fileName}`);
                attachmentUrl = publicUrl;
              }
            }
         }
      }

      if (!imageBuffer && !messageText) {
         return NextResponse.json({ ok: true });
      }

      // Gemini AI Analizi
      await sendTelegramMessage(chatId, "⏳ Mesajınız/Dekontunuz analiz ediliyor...");
      
      const extractionResult = await extractExpenseDataWithGemini(messageText, imageBuffer, mimeType);

      if (!extractionResult) {
        await sendTelegramMessage(chatId, "❌ Dekont analiz edilemedi. Lütfen manuel olarak girin.");
        return NextResponse.json({ ok: true });
      }

      if (!extractionResult.date) {
        // AI tarih bulamazsa, Telegram'ın mesaj tarihini kullan
        extractionResult.date = new Date(message.date * 1000).toISOString().split('T')[0];
      }

      if (extractionResult.amount === null) {
        await sendTelegramMessage(chatId, "⚠️ Gider eklenemedi.\n\nDekonttan tutar okunamadı.\nLütfen fotoğrafın net olduğundan emin olun veya manuel ekleyin.");
        return NextResponse.json({ ok: true });
      }

      // Eğer işletme adı varsa açıklamaya parantez içinde ekle (çünkü DB'de işletme kolonu yok)
      let finalDescription = extractionResult.description;
      if (extractionResult.merchant && !finalDescription.toLocaleLowerCase('tr').includes(extractionResult.merchant.toLocaleLowerCase('tr'))) {
        finalDescription = `${finalDescription} (${extractionResult.merchant})`;
      }
      extractionResult.description = finalDescription;

      // Güvenlik ve Onay Mekanizması
      const pendingId = crypto.randomBytes(8).toString("hex");
      savePendingExpense(pendingId, {
        ...extractionResult,
        attachmentUrl,
        telegramMessageId: telegramMessageIdStr
      });

      const displayDate = extractionResult.date.split("-").reverse().join(".");

      const confirmMessage = `
⚠️ Gider bilgilerini şu şekilde algıladım:

💰 Tutar: ${extractionResult.amount} TL
📝 Açıklama: ${extractionResult.description}
📁 Kategori: ${extractionResult.category}
📅 Tarih: ${displayDate}

Onaylıyor musunuz?`;

      await sendTelegramMessage(chatId, confirmMessage, {
        inline_keyboard: [
          [
            { text: "✅ Onayla", callback_data: `confirm_${pendingId}` },
            { text: "❌ İptal", callback_data: `cancel_${pendingId}` }
          ]
        ]
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    // Telegram 500 alıp tekrar tekrar istek atmasın diye 200 dönüyoruz
    return NextResponse.json({ ok: true, error: error?.message });
  }
}
