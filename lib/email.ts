import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFICATION_EMAILS = process.env.NOTIFICATION_EMAILS?.split(',') || []

export interface EmailOptions {
  subject: string
  html: string
  to?: string[]
}

/**
 * Send email using Resend
 */
export async function sendEmail({ subject, html, to }: EmailOptions) {
  try {
    const recipients = to || NOTIFICATION_EMAILS

    const { data, error } = await resend.emails.send({
      from: 'Bromak Agency <noreply@bromak.brodigitalmedia.com>',
      to: recipients,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email send exception:', error)
    return { success: false, error }
  }
}

/**
 * Send leave notification email
 */
export async function sendLeaveNotification(leave: {
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  status: string
}) {
  const subject = `🏖️ Yeni İzin Talebi: ${leave.employee_name}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #6b7280; }
          .info-value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>🏖️ Yeni İzin Talebi</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p><strong>${leave.employee_name}</strong> yeni bir izin talebi oluşturdu.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Çalışan:</span>
                <span class="info-value">${leave.employee_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">İzin Türü:</span>
                <span class="info-value">${leave.leave_type}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Başlangıç:</span>
                <span class="info-value">${new Date(leave.start_date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Bitiş:</span>
                <span class="info-value">${new Date(leave.end_date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Toplam Gün:</span>
                <span class="info-value">${leave.total_days} gün</span>
              </div>
              <div class="info-row">
                <span class="info-label">Durum:</span>
                <span class="info-value">${leave.status === 'approved' ? '✅ Onaylandı' : leave.status === 'pending' ? '⏳ Beklemede' : '❌ İptal Edildi'}</span>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              <a href="https://bromak.brodigitalmedia.com/izinler" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">İzinleri Görüntüle</a>
            </p>
          </div>
          <div class="footer">
            <p>Bu mail Bromak Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}

/**
 * Send project notification email
 */
export async function sendProjectNotification(project: {
  name: string
  customer_name: string
  status: string
  total_amount?: number
}) {
  const subject = `📁 Yeni Proje Eklendi: ${project.name}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #6b7280; }
          .info-value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>📁 Yeni Proje Eklendi</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Sisteme yeni bir proje eklendi.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Proje Adı:</span>
                <span class="info-value">${project.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Müşteri:</span>
                <span class="info-value">${project.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Durum:</span>
                <span class="info-value">${project.status}</span>
              </div>
              ${project.total_amount ? `
              <div class="info-row">
                <span class="info-label">Tutar:</span>
                <span class="info-value">₺${project.total_amount.toLocaleString('tr-TR')}</span>
              </div>
              ` : ''}
            </div>
            
            <p style="margin-top: 30px;">
              <a href="https://bromak.brodigitalmedia.com" style="background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Projeleri Görüntüle</a>
            </p>
          </div>
          <div class="footer">
            <p>Bu mail Bromak Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}

/**
 * Send expense notification email
 */
export async function sendExpenseNotification(expense: {
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}) {
  const isIncome = expense.type === 'income'
  const subject = `${isIncome ? '💰 Yeni Gelir' : '💸 Yeni Gider'}: ${expense.description}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${isIncome ? '#4ade80 0%, #22c55e 100%' : '#f87171 0%, #ef4444 100%'}); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isIncome ? '#22c55e' : '#ef4444'}; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #6b7280; }
          .info-value { color: #111827; }
          .amount { font-size: 24px; font-weight: bold; color: ${isIncome ? '#22c55e' : '#ef4444'}; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>${isIncome ? '💰 Yeni Gelir Kaydı' : '💸 Yeni Gider Kaydı'}</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Sisteme yeni bir ${isIncome ? 'gelir' : 'gider'} kaydı eklendi.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Açıklama:</span>
                <span class="info-value">${expense.description}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Kategori:</span>
                <span class="info-value">${expense.category}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarih:</span>
                <span class="info-value">${new Date(expense.date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tutar:</span>
                <span class="amount">${isIncome ? '+' : '-'}₺${expense.amount.toLocaleString('tr-TR')}</span>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              <a href="https://bromak.brodigitalmedia.com/giderler" style="background: ${isIncome ? '#22c55e' : '#ef4444'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Gelir/Giderleri Görüntüle</a>
            </p>
          </div>
          <div class="footer">
            <p>Bu mail Bromak Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}

/**
 * Send weekly summary email (Monday 10:00)
 */
export async function sendWeeklySummary(summary: {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  activeProjects: number
  onLeaveToday: number
}) {
  const subject = `📊 Haftalık Özet - ${new Date().toLocaleDateString('tr-TR')}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e5e7eb; }
          .stat-value { font-size: 28px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .stat-label { color: #6b7280; font-size: 14px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>📊 Haftalık Özet</h1>
            <p>Günaydın! İşte bu haftanın özeti:</p>
          </div>
          <div class="content">
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-label">Toplam Gelir</div>
                <div class="stat-value" style="color: #22c55e;">₺${summary.totalRevenue.toLocaleString('tr-TR')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Toplam Gider</div>
                <div class="stat-value" style="color: #ef4444;">₺${summary.totalExpenses.toLocaleString('tr-TR')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Net Kar</div>
                <div class="stat-value" style="color: ${summary.netProfit >= 0 ? '#22c55e' : '#ef4444'};">₺${summary.netProfit.toLocaleString('tr-TR')}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Aktif Projeler</div>
                <div class="stat-value">${summary.activeProjects}</div>
              </div>
            </div>
            
            <p style="margin-top: 30px; text-align: center;">
              <a href="https://bromak.brodigitalmedia.com" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Dashboard'u Görüntüle</a>
            </p>
          </div>
          <div class="footer">
            <p>İyi çalışmalar dileriz! 💪</p>
            <p>Bu mail Bromak Yönetim Sistemi tarafından otomatik olarak gönderilmiştir.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}

/**
 * Send weekend greeting email (Saturday 18:00)
 */
export async function sendWeekendGreeting() {
  const subject = `🎉 İyi Tatiller!`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 50px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .emoji { font-size: 64px; margin: 20px 0; }
          .message { font-size: 18px; color: #374151; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>🎉 Hafta Sonu Geldi!</h1>
          </div>
          <div class="content">
            <div class="emoji">🏖️</div>
            <p class="message">
              Harika bir hafta geçirdiniz! 🎊<br>
              Şimdi dinlenme zamanı. İyi tatiller! 🌟
            </p>
            <p style="margin-top: 30px; color: #6b7280;">
              Pazartesi sabahı yeni bir haftaya başlamak için buluşalım! 💪
            </p>
          </div>
          <div class="footer">
            <p>Bromak Ekibi 💙</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}

/**
 * Send evening greeting email (Daily 19:00, except Sunday)
 */
export async function sendEveningGreeting() {
  const subject = `🌙 İyi Akşamlar!`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 50px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px; text-align: center; }
          .emoji { font-size: 64px; margin: 20px 0; }
          .message { font-size: 18px; color: #374151; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://bromak.brodigitalmedia.com/bromak.png" alt="Bromak Agency" style="width: 120px; margin-bottom: 20px;">
            <h1>🌙 İyi Akşamlar!</h1>
          </div>
          <div class="content">
            <div class="emoji">✨</div>
            <p class="message">
              Bugün de harika işler çıkardınız! 🎯<br>
              Şimdi dinlenme zamanı. İyi dinlenmeler! 😊
            </p>
            <p style="margin-top: 30px; color: #6b7280;">
              Yarın yeni bir günde görüşmek üzere! 💙
            </p>
          </div>
          <div class="footer">
            <p>Bromak Ekibi 💙</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({ subject, html })
}
