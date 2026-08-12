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

// Supabase Storage tabanlı kalıcı pending cache (RLS çakışmasını önlemek için önce remove sonra upload yapılır)
async function savePendingExpense(id: string, data: any) {
  try {
    const jsonStr = JSON.stringify(data);
    await supabase.storage.from("expenses").remove([`pending/${id}.json`]);
    await supabase.storage
      .from("expenses")
      .upload(`pending/${id}.json`, Buffer.from(jsonStr), { contentType: "application/json" });

    if (data.chatId) {
      const latestPath = `pending/latest_${data.chatId}.json`;
      await supabase.storage.from("expenses").remove([latestPath]);
      await supabase.storage
        .from("expenses")
        .upload(latestPath, Buffer.from(JSON.stringify({ pendingId: id })), { contentType: "application/json" });
    }
  } catch (e) {
    console.error("savePendingExpense error:", e);
  }
}

async function getPendingExpense(id: string) {
  try {
    const { data, error } = await supabase.storage
      .from("expenses")
      .download(`pending/${id}.json`);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("getPendingExpense error:", e);
    return null;
  }
}

async function getLatestPendingExpense(chatId: string | number) {
  try {
    const { data } = await supabase.storage
      .from("expenses")
      .download(`pending/latest_${chatId}.json`);
    if (!data) return null;
    const json = JSON.parse(await data.text());
    if (!json?.pendingId) return null;
    return await getPendingExpense(json.pendingId);
  } catch {
    return null;
  }
}

async function deletePendingExpense(id: string, chatId?: string | number) {
  try {
    await supabase.storage.from("expenses").remove([`pending/${id}.json`]);
    if (chatId) {
      await supabase.storage.from("expenses").remove([`pending/latest_${chatId}.json`]);
    }
  } catch (e) {
    console.error("deletePendingExpense error:", e);
  }
}

async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    }),
  });
  return await res.json();
}

async function editTelegramMessageText(chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    }),
  });
}

function buildConfirmationKeyboard(pendingId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Onayla", callback_data: `confirm_${pendingId}` },
        { text: "❌ İptal", callback_data: `cancel_${pendingId}` }
      ],
      [
        { text: "✏️ Düzenle (Kategori / Tutar / Not / Tarih)", callback_data: `menu_${pendingId}` }
      ]
    ]
  };
}

function buildEditMenuKeyboard(pendingId: string) {
  return {
    inline_keyboard: [
      [
        { text: "📁 Kategori Değiştir", callback_data: `editcat_${pendingId}` },
        { text: "💰 Tutar Değiştir", callback_data: `editamt_${pendingId}` }
      ],
      [
        { text: "📝 Açıklama Değiştir", callback_data: `editdesc_${pendingId}` },
        { text: "📅 Tarih Değiştir", callback_data: `editdate_${pendingId}` }
      ],
      [
        { text: "🔙 Geri (Onay Ekranı)", callback_data: `back_${pendingId}` }
      ]
    ]
  };
}

function buildCategoryKeyboard(pendingId: string) {
  return {
    inline_keyboard: [
      [
        { text: "Yakıt", callback_data: `setcat_${pendingId}_Yakıt` },
        { text: "Market", callback_data: `setcat_${pendingId}_Market` },
        { text: "Faturalar", callback_data: `setcat_${pendingId}_Faturalar` }
      ],
      [
        { text: "Kira", callback_data: `setcat_${pendingId}_Kira` },
        { text: "Yemek", callback_data: `setcat_${pendingId}_Yemek` },
        { text: "Dijital", callback_data: `setcat_${pendingId}_Dijital` }
      ],
      [
        { text: "Maaş", callback_data: `setcat_${pendingId}_Maaş` },
        { text: "Ekipman", callback_data: `setcat_${pendingId}_Ekipman` },
        { text: "Diğer", callback_data: `setcat_${pendingId}_Diğer` }
      ],
      [
        { text: "🔙 Geri", callback_data: `menu_${pendingId}` }
      ]
    ]
  };
}

function renderConfirmationMessage(pendingData: any, isUpdated: boolean = false): string {
  const displayDate = pendingData.date ? pendingData.date.split("-").reverse().join(".") : "";
  return `
⚠️ Gider bilgilerini şu şekilde algıladım:

💰 Tutar: ${pendingData.amount} TL
📝 Açıklama: ${pendingData.description}
📁 Kategori: ${pendingData.category}
📅 Tarih: ${displayDate}
${isUpdated ? "\n<i>(Düzenleme güncellendi ✏️)</i>" : ""}

Onaylıyor musunuz?`;
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
      const data = callbackQuery.data;

      if (String(chatId) !== String(ALLOWED_CHAT_ID)) {
        return NextResponse.json({ ok: true });
      }

      const [action, id, param] = data.split("_");
      const messageId = callbackQuery.message.message_id;

      if (action === "confirm") {
        const pendingData = await getPendingExpense(id);
        if (!pendingData) {
          await editTelegramMessageText(chatId, messageId, "⚠️ İstek zaman aşımına uğramış veya bulunamadı.");
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
          if (error.code === '23505') {
            await editTelegramMessageText(chatId, messageId, "⚠️ Bu gider mevcuttur (Çift Kayıt).");
          } else {
            await editTelegramMessageText(chatId, messageId, "❌ Kayıt sırasında veritabanı hatası oluştu.");
          }
        } else {
          const displayDate = pendingData.date.split("-").reverse().join(".");
          await editTelegramMessageText(chatId, messageId, `✅ Gider başarıyla eklendi!\n\n💰 Tutar: ${pendingData.amount} TL\n📝 Açıklama: ${pendingData.description}\n📁 Kategori: ${pendingData.category}\n📅 Tarih: ${displayDate}`);
        }
        await deletePendingExpense(id, chatId);

      } else if (action === "cancel") {
        await editTelegramMessageText(chatId, messageId, "❌ İşlem iptal edildi.");
        await deletePendingExpense(id, chatId);

      } else if (action === "menu") {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.waitingFor = null;
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, "✏️ <b>Neyi düzenlemek istersiniz?</b>", buildEditMenuKeyboard(id));
        }

      } else if (action === "editcat") {
        await editTelegramMessageText(chatId, messageId, "📁 <b>Lütfen yeni kategoriyi seçin:</b>", buildCategoryKeyboard(id));

      } else if (action === "setcat" && param) {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.category = param;
          pendingData.waitingFor = null;
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, renderConfirmationMessage(pendingData, true), buildConfirmationKeyboard(id));
        }

      } else if (action === "editamt") {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.waitingFor = "amount";
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, "💰 <b>Lütfen yeni tutarı rakam olarak yazın:</b>\n<i>(Örn: 250 veya 1500.50)</i>", {
            inline_keyboard: [[{ text: "🔙 İptal / Geri", callback_data: `menu_${id}` }]]
          });
        }

      } else if (action === "editdesc") {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.waitingFor = "description";
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, "📝 <b>Lütfen yeni açıklamayı yazın:</b>\n<i>(Örn: Ofis için kırtasiye alışverişi)</i>", {
            inline_keyboard: [[{ text: "🔙 İptal / Geri", callback_data: `menu_${id}` }]]
          });
        }

      } else if (action === "editdate") {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.waitingFor = "date";
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, "📅 <b>Lütfen yeni tarihi GG.AA.YYYY formatında yazın:</b>\n<i>(Örn: 15.08.2026)</i>", {
            inline_keyboard: [[{ text: "🔙 İptal / Geri", callback_data: `menu_${id}` }]]
          });
        }

      } else if (action === "back") {
        const pendingData = await getPendingExpense(id);
        if (pendingData) {
          pendingData.waitingFor = null;
          await savePendingExpense(id, pendingData);
          await editTelegramMessageText(chatId, messageId, renderConfirmationMessage(pendingData), buildConfirmationKeyboard(id));
        }
      }

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery?callback_query_id=${callbackQuery.id}`);
      return NextResponse.json({ ok: true });
    }

    // 2. Normal Mesaj İşlemi
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id;
      let messageText = message.caption || message.text || "";

      if (String(chatId) !== String(ALLOWED_CHAT_ID)) {
        if (messageText.includes("id")) {
           await sendTelegramMessage(chatId, `Bu grubun (veya sohbetin) ID'si: <b>${chatId}</b>\n\nBu ID'yi .env.local dosyanızdaki TELEGRAM_ALLOWED_CHAT_ID bölümüne yapıştırabilirsiniz.`);
        }
        return NextResponse.json({ ok: true });
      }

      // Kullanıcının aktif bir düzenleme (waitingFor) isteği var mı kontrol et
      const activePendingData = await getLatestPendingExpense(chatId);
      if (activePendingData && activePendingData.waitingFor && messageText && !message.photo && !message.document) {
        const field = activePendingData.waitingFor;
        let isSuccess = false;

        if (field === "amount") {
          const rawNum = messageText.replace(/\./g, "").replace(/,/g, ".");
          const num = parseFloat(rawNum);
          if (!isNaN(num) && num > 0) {
            activePendingData.amount = num;
            isSuccess = true;
          } else {
            await sendTelegramMessage(chatId, "⚠️ Lütfen geçerli bir tutar yazın (Örn: 250 veya 1500.50).");
            return NextResponse.json({ ok: true });
          }
        } else if (field === "description") {
          activePendingData.description = messageText.trim();
          isSuccess = true;
        } else if (field === "date") {
          const parts = messageText.trim().split(".");
          if (parts.length === 3) {
            const [d, m, y] = parts;
            activePendingData.date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            isSuccess = true;
          } else if (messageText.includes("-")) {
            activePendingData.date = messageText.trim();
            isSuccess = true;
          } else {
            await sendTelegramMessage(chatId, "⚠️ Lütfen tarihi GG.AA.YYYY formatında yazın (Örn: 15.08.2026).");
            return NextResponse.json({ ok: true });
          }
        }

        if (isSuccess) {
          activePendingData.waitingFor = null;
          await savePendingExpense(activePendingData.pendingId, activePendingData);
          await sendTelegramMessage(chatId, renderConfirmationMessage(activePendingData, true), buildConfirmationKeyboard(activePendingData.pendingId));
          return NextResponse.json({ ok: true });
        }
      }

      const messageId = message.message_id;
      const telegramMessageIdStr = `${chatId}_${messageId}`;

      // Daha önce işlenmiş mi?
      const { data: existingData } = await supabase
        .from("expenses")
        .select("id")
        .eq("telegram_message_id", telegramMessageIdStr)
        .single();
        
      if (existingData) {
        await sendTelegramMessage(chatId, "⚠️ Bu dekont zaten işlenmiş.");
        return NextResponse.json({ ok: true });
      }

      let imageBuffer: Buffer | undefined;
      let mimeType: string | undefined;
      let attachmentUrl = "";

      if (message.photo && message.photo.length > 0) {
        const photo = message.photo[message.photo.length - 1];
        const fileData = await getTelegramFile(photo.file_id);
        if (fileData) {
          imageBuffer = fileData.buffer;
          mimeType = "image/jpeg";

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
              imageBuffer = fileData.buffer;
              mimeType = doc.mime_type;
              
              if (isPdf) {
                 try {
                    const pdfModule = require("pdf-parse");
                    let pdfText = "";

                    if (pdfModule.PDFParse) {
                       const parser = new pdfModule.PDFParse({ data: fileData.buffer });
                       const parsed = await parser.getText();
                       pdfText = parsed.text || "";
                    } else if (typeof pdfModule === "function") {
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
      const extractionResult = await extractExpenseDataWithGemini(messageText, imageBuffer, mimeType);

      if (!extractionResult) {
        await sendTelegramMessage(chatId, "❌ Dekont analiz edilemedi. Lütfen manuel olarak girin.");
        return NextResponse.json({ ok: true });
      }

      if (!extractionResult.date) {
        extractionResult.date = new Date(message.date * 1000).toISOString().split('T')[0];
      }

      if (extractionResult.amount === null) {
        await sendTelegramMessage(chatId, "⚠️ Gider eklenemedi.\n\nDekonttan tutar okunamadı.\nLütfen fotoğrafın net olduğundan emin olun veya manuel ekleyin.");
        return NextResponse.json({ ok: true });
      }

      let finalDescription = extractionResult.description;
      if (extractionResult.merchant && !finalDescription.toLocaleLowerCase('tr').includes(extractionResult.merchant.toLocaleLowerCase('tr'))) {
        finalDescription = `${finalDescription} (${extractionResult.merchant})`;
      }
      extractionResult.description = finalDescription;

      const pendingId = crypto.randomBytes(8).toString("hex");
      const pendingDataToSave = {
        ...extractionResult,
        pendingId,
        chatId,
        attachmentUrl,
        telegramMessageId: telegramMessageIdStr
      };

      await savePendingExpense(pendingId, pendingDataToSave);

      await sendTelegramMessage(chatId, renderConfirmationMessage(pendingDataToSave), buildConfirmationKeyboard(pendingId));
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true, error: error?.message });
  }
}
