import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveNotification } from '@/lib/email'

/**
 * Test endpoint for email functionality
 * Usage: GET http://localhost:3000/api/test-email
 */
export async function GET(request: NextRequest) {
    try {
        const testLeave = {
            employee_name: 'Test Kullanıcı',
            leave_type: 'Yıllık İzin',
            start_date: '2026-02-10',
            end_date: '2026-02-14',
            total_days: 5,
            status: 'approved' as const
        }

        const result = await sendLeaveNotification(testLeave)

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Test email sent successfully! Check your inbox.',
                data: result.data
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Test email error:', error)
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 })
    }
}
