import { type LeaveType } from '@/types/leave'
import { format, differenceInDays, isWeekend, eachDayOfInterval, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

/**
 * Calculate working days between two dates (excluding weekends)
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    return days.filter(day => !isWeekend(day)).length
}

/**
 * Calculate total days including weekends
 */
export function calculateTotalDays(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate) + 1
}

/**
 * Get color for leave type
 */
export function getLeaveTypeColor(type: LeaveType): {
    bg: string
    text: string
    border: string
    badge: string
} {
    switch (type) {
        case 'Yıllık İzin':
            return {
                bg: 'bg-green-500/10',
                text: 'text-green-700 dark:text-green-400',
                border: 'border-green-500/20',
                badge: 'bg-green-500'
            }
        case 'Hastalık İzni':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-700 dark:text-red-400',
                border: 'border-red-500/20',
                badge: 'bg-red-500'
            }
        case 'Diğer':
            return {
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-700 dark:text-yellow-400',
                border: 'border-yellow-500/20',
                badge: 'bg-yellow-500'
            }
        default:
            return {
                bg: 'bg-gray-500/10',
                text: 'text-gray-700 dark:text-gray-400',
                border: 'border-gray-500/20',
                badge: 'bg-gray-500'
            }
    }
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

    const startFormatted = format(start, 'd MMM', { locale: tr })
    const endFormatted = format(end, 'd MMM yyyy', { locale: tr })

    return `${startFormatted} - ${endFormatted}`
}

/**
 * Format single date
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'd MMMM yyyy', { locale: tr })
}

/**
 * Get status label in Turkish
 */
export function getStatusLabel(status: string): string {
    switch (status) {
        case 'approved':
            return 'Onaylandı'
        case 'pending':
            return 'Beklemede'
        case 'cancelled':
            return 'İptal Edildi'
        default:
            return status
    }
}

/**
 * Get status color
 */
export function getStatusColor(status: string): {
    bg: string
    text: string
} {
    switch (status) {
        case 'approved':
            return {
                bg: 'bg-green-500/10',
                text: 'text-green-700 dark:text-green-400'
            }
        case 'pending':
            return {
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-700 dark:text-yellow-400'
            }
        case 'cancelled':
            return {
                bg: 'bg-gray-500/10',
                text: 'text-gray-700 dark:text-gray-400'
            }
        default:
            return {
                bg: 'bg-gray-500/10',
                text: 'text-gray-700 dark:text-gray-400'
            }
    }
}

/**
 * Check if a date is within a leave period
 */
export function isDateInLeavePeriod(
    date: Date,
    startDate: string | Date,
    endDate: string | Date
): boolean {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

    return date >= start && date <= end
}

/**
 * Get leave type icon emoji
 */
export function getLeaveTypeIcon(type: LeaveType): string {
    switch (type) {
        case 'Yıllık İzin':
            return '🏖️'
        case 'Hastalık İzni':
            return '🤒'
        case 'Diğer':
            return '📋'
        default:
            return '📅'
    }
}
