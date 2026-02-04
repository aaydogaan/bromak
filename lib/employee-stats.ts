import type { LeaveRecord } from "@/types/leave"

export interface EmployeeLeaveStats {
    name: string
    totalDays: number
    leaveCount: number
}

/**
 * Calculate leave statistics for each employee
 */
export function calculateEmployeeStats(leaves: LeaveRecord[]): EmployeeLeaveStats[] {
    const statsMap = new Map<string, EmployeeLeaveStats>()

    leaves
        .filter((leave) => leave.status === "approved")
        .forEach((leave) => {
            const existing = statsMap.get(leave.employee_name)
            if (existing) {
                existing.totalDays += leave.total_days
                existing.leaveCount += 1
            } else {
                statsMap.set(leave.employee_name, {
                    name: leave.employee_name,
                    totalDays: leave.total_days,
                    leaveCount: 1,
                })
            }
        })

    return Array.from(statsMap.values()).sort((a, b) => a.totalDays - b.totalDays)
}

/**
 * Get the employee with the least leave days
 * Only considers employees with approved leaves
 */
export function getLeastLeaveEmployee(leaves: LeaveRecord[]): EmployeeLeaveStats | null {
    const stats = calculateEmployeeStats(leaves)

    // Filter out employees with 0 days (shouldn't happen but just in case)
    const validStats = stats.filter(s => s.totalDays > 0)

    // Return the one with least days
    return validStats.length > 0 ? validStats[0] : null
}

/**
 * Get badge emoji based on ranking
 */
export function getBadgeEmoji(rank: number): string {
    switch (rank) {
        case 1:
            return "🏆" // Gold trophy
        case 2:
            return "🥈" // Silver medal
        case 3:
            return "🥉" // Bronze medal
        default:
            return "⭐" // Star
    }
}
