import { NextRequest, NextResponse } from 'next/server'
import { sendExpenseNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('Expense Email Request:', body)

        const result = await sendExpenseNotification(body)
        console.log('Expense Email Result:', result)

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email sent successfully' })
        } else {
            console.error('Expense Email Send Failed:', result.error)
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
