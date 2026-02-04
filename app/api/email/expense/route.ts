import { NextRequest, NextResponse } from 'next/server'
import { sendExpenseNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const result = await sendExpenseNotification(body)

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully' })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
