import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN eksik" }, { status: 400 });
  }

  if (!siteUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL eksik" }, { status: 400 });
  }

  const webhookUrl = `${siteUrl}/api/telegram/webhook`;
  const setWebhookApi = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

  try {
    const response = await fetch(setWebhookApi);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Webhook ayarlama işlemi sonucu",
      data,
    });
  } catch (error) {
    console.error("Webhook set error:", error);
    return NextResponse.json({ error: "Webhook ayarlanamadı" }, { status: 500 });
  }
}
