import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklySummary } from '@/lib/email'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization')
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createClient()
        const now = new Date()
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)

        // Get revenue data
        const { data: revenueData } = await supabase
            .from('revenue')
            .select('amount, type')
            .gte('date', monthStart.toISOString())
            .lte('date', monthEnd.toISOString())

        const totalRevenue = revenueData
            ?.filter((r: any) => r.type === 'income')
            .reduce((sum: number, r: any) => sum + r.amount, 0) || 0

        const totalExpenses = revenueData
            ?.filter((r: any) => r.type === 'expense')
            .reduce((sum: number, r: any) => sum + r.amount, 0) || 0

        // Get active projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id')
            .eq('status', 'Devam Ediyor')

        // Get leaves today
        const { data: leaves } = await supabase
            .from('leave_records')
            .select('*')
            .eq('status', 'approved')
            .lte('start_date', now.toISOString().split('T')[0])
            .gte('end_date', now.toISOString().split('T')[0])

        const summary = {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            activeProjects: projects?.length || 0,
            onLeaveToday: leaves?.length || 0,
        }

        const result = await sendWeeklySummary(summary)

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Weekly summary sent' })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Weekly summary cron error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
