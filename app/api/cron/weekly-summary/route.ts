import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklySummary } from '@/lib/email'
import { createClient } from '@/lib/supabase/client'
import { startOfMonth, endOfMonth, subDays } from 'date-fns'

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

        // 1. Get Revenue (from Projects)
        const { data: projectsData } = await supabase
            .from('projects')
            .select('budget, payment_amount, payment_date, start_date')
            .neq('status', 'cancelled')

        const parseTurkishNumber = (value: string): number => {
            if (!value) return 0
            const cleaned = value.replace(/[^0-9.,]/g, '')
            
            if (cleaned.includes('.') && cleaned.includes(',')) {
                const normalized = cleaned.replace(/\./g, '').replace(',', '.')
                return parseFloat(normalized) || 0
            }
            
            if (cleaned.includes(',')) {
                const normalized = cleaned.replace(',', '.')
                return parseFloat(normalized) || 0
            }
            
            if (cleaned.includes('.')) {
                const parts = cleaned.split('.')
                const lastPart = parts[parts.length - 1]
                if (lastPart.length === 3) {
                    const normalized = cleaned.replace(/\./g, '')
                    return parseFloat(normalized) || 0
                } else {
                    return parseFloat(cleaned) || 0
                }
            }
            
            return parseFloat(cleaned) || 0
        }

        const totalRevenue = (projectsData || []).reduce((sum, project) => {
            const dateStr = project.payment_date || project.start_date
            if (!dateStr) return sum

            const projectDate = new Date(dateStr)
            if (projectDate >= monthStart && projectDate <= monthEnd) {
                const amount = parseTurkishNumber(String(project.payment_amount || project.budget || '0'))
                return sum + amount
            }
            return sum
        }, 0)

        // 2. Get Expenses
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount, date')
            .gte('date', monthStart.toISOString())
            .lte('date', monthEnd.toISOString())

        const totalExpenses = (expensesData || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)

        // 3. Get Active Projects
        const { data: activeProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('status', 'in_progress')

        // 4. Get Leaves Today
        const { data: leaves } = await supabase
            .from('leave_records')
            .select('*')
            .eq('status', 'approved')
            .lte('start_date', now.toISOString().split('T')[0])
            .gte('end_date', now.toISOString().split('T')[0])

        // 5. Get New Projects This Week
        const oneWeekAgo = subDays(now, 7)
        const { data: newProjectsData } = await supabase
            .from('projects')
            .select('id, name')
            .gte('created_at', oneWeekAgo.toISOString())

        const summary = {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            activeProjects: activeProjects?.length || 0,
            onLeaveToday: leaves?.length || 0,
            newProjectsThisWeek: newProjectsData?.length || 0,
        }

        const result = await sendWeeklySummary(summary)

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Weekly summary sent', data: summary })
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Weekly summary cron error:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
