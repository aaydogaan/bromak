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

    // 4. Employees
    const { data: employees } = await supabase
        .from('employees')
        .select('*')

    // 5. Clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')

    const activeProjectsCount = projects?.filter(p => p.status === 'in_progress').length || 0
    const completedProjectsCount = projects?.filter(p => p.status === 'completed').length || 0

    const totalRevenue = (projects || []).reduce((sum, p) => {
        const rawValue = String(p.payment_amount || p.budget || '0').replace(/[^0-9.-]/g, '')
        const amount = parseFloat(rawValue) || 0
        return sum + amount
    }, 0)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    // Group expenses by category
    const expensesByCategory = (expenses || []).reduce((acc, e) => {
        const category = e.category || 'Diğer'
        if (!acc[category]) acc[category] = 0
        acc[category] += Number(e.amount) || 0
        return acc
    }, {} as Record<string, number>)

    return {
        summary: {
            totalProjects: projects?.length || 0,
            activeProjects: activeProjectsCount,
            completedProjects: completedProjectsCount,
            totalRevenue: totalRevenue || 0,
            totalExpenses: totalExpenses || 0,
            netProfit: (totalRevenue || 0) - (totalExpenses || 0),
            onLeaveCount: leaves?.length || 0,
            totalEmployees: employees?.length || 0,
            totalClients: clients?.length || 0,
        },
        projects: projects?.map(p => ({
            name: p.name,
            client: p.client,
            status: p.status,
            budget: p.budget,
            payment_amount: p.payment_amount,
            start_date: p.start_date,
            end_date: p.end_date,
        })),
        recentExpenses: expenses?.slice(0, 10).map(e => ({
            category: e.category,
            amount: e.amount,
            description: e.description,
            date: e.date
        })),
        expensesByCategory,
        upcomingLeaves: leaves?.map(l => ({
            employee: l.employee_name,
            start: l.start_date,
            end: l.end_date,
            type: l.leave_type
        })),
        employees: employees?.map(e => ({
            name: e.name,
            position: e.position,
            email: e.email,
        })),
        clients: clients?.map(c => ({
            name: c.name,
            company: c.company,
            email: c.email,
        }))
    }
}
