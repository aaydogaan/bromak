export type LeaveType = 'Yıllık İzin' | 'Hastalık İzni' | 'Diğer'

export type LeaveStatus = 'approved' | 'pending' | 'cancelled'

export interface LeaveRecord {
    id: string
    employee_name: string
    leave_type: LeaveType
    start_date: string
    end_date: string
    total_days: number
    description: string | null
    status: LeaveStatus
    created_at: string
    updated_at: string
}

export interface LeaveFormData {
    employee_name: string
    leave_type: LeaveType
    start_date: Date
    end_date: Date
    total_days: number
    description: string
    status: LeaveStatus
}

export interface LeaveStats {
    totalLeaveDays: number
    onLeaveToday: number
    upcomingLeaves: number
    leavesByType: {
        type: LeaveType
        count: number
        days: number
    }[]
}
