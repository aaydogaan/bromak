import { NextRequest, NextResponse } from 'next/server'
import { sendEveningGreeting } from '@/lib/email'

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if today is Sunday (0 = Sunday)
        const today = new Date()
        if (today.getDay() === 0) {
            return NextResponse.json({
                success: true,
                message: 'Skipped: Today is Sunday'
            })
        }

        const result = await sendEveningGreeting()

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Evening greeting sent' })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Evening greeting cron error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
