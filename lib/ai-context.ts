import { createClient } from './supabase/client'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getBromakContext() {
    const supabase = createClient()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // 1. Projects
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .neq('status', 'cancelled')

    // 2. Expenses (this month)
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', monthStart.toISOString())
        .lte('date', monthEnd.toISOString())

    // 3. Leave Records (current and future)
    const { data: leaves } = await supabase
        .from('leave_records')
        .select('*')
        .eq('status', 'approved')
        .gte('end_date', format(now, "yyyy-MM-dd"))

    const activeProjectsCount = projects?.filter(p => p.status === 'in_progress').length || 0
    const completedProjectsCount = projects?.filter(p => p.status === 'completed').length || 0

    const totalRevenue = (projects || []).reduce((sum, p) => {
        const rawValue = String(p.payment_amount || p.budget || '0').replace(/[^0-9.-]/g, '')
        const amount = parseFloat(rawValue) || 0
        return sum + amount
    }, 0)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    return {
        summary: {
            totalProjects: projects?.length || 0,
            activeProjects: activeProjectsCount,
            completedProjects: completedProjectsCount,
            totalRevenue: totalRevenue || 0,
            totalExpenses: totalExpenses || 0,
            netProfit: (totalRevenue || 0) - (totalExpenses || 0),
            onLeaveCount: leaves?.length || 0
        },
        projects: projects?.map(p => ({
            name: p.name,
            client: p.client,
            status: p.status,
            budget: p.budget
        })),
        recentExpenses: expenses?.slice(0, 10).map(e => ({
            category: e.category,
            amount: e.amount,
            description: e.description,
            date: e.date
        })),
        upcomingLeaves: leaves?.map(l => ({
            employee: l.employee_name,
            start: l.start_date,
            end: l.end_date,
            type: l.leave_type
        }))
    }
}
