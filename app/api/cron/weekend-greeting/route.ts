import { NextRequest, NextResponse } from 'next/server'
import { sendWeekendGreeting } from '@/lib/email'

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await sendWeekendGreeting()

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Weekend greeting sent' })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Weekend greeting cron error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
