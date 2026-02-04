/**
 * Turkish Public Holidays for 2026
 * Note: Religious holidays are approximate and may vary by 1-2 days
 */

export interface Holiday {
    date: string // YYYY-MM-DD format
    name: string
    type: 'national' | 'religious'
}

export const turkishHolidays2026: Holiday[] = [
    // National Holidays
    { date: '2026-01-01', name: 'Yılbaşı', type: 'national' },
    { date: '2026-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'national' },
    { date: '2026-05-01', name: 'Emek ve Dayanışma Günü', type: 'national' },
    { date: '2026-05-19', name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', type: 'national' },
    { date: '2026-08-30', name: 'Zafer Bayramı', type: 'national' },
    { date: '2026-10-29', name: 'Cumhuriyet Bayramı', type: 'national' },

    // Religious Holidays (Ramazan Bayramı - approximate)
    { date: '2026-03-20', name: 'Ramazan Bayramı 1. Gün', type: 'religious' },
    { date: '2026-03-21', name: 'Ramazan Bayramı 2. Gün', type: 'religious' },
    { date: '2026-03-22', name: 'Ramazan Bayramı 3. Gün', type: 'religious' },

    // Religious Holidays (Kurban Bayramı - approximate)
    { date: '2026-05-27', name: 'Kurban Bayramı 1. Gün', type: 'religious' },
    { date: '2026-05-28', name: 'Kurban Bayramı 2. Gün', type: 'religious' },
    { date: '2026-05-29', name: 'Kurban Bayramı 3. Gün', type: 'religious' },
    { date: '2026-05-30', name: 'Kurban Bayramı 4. Gün', type: 'religious' },
]

/**
 * Check if a date is a Turkish public holiday
 */
export function isTurkishHoliday(date: Date): Holiday | null {
    // Format date as YYYY-MM-DD in local timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    return turkishHolidays2026.find(h => h.date === dateStr) || null
}

/**
 * Get all holidays in a given month
 */
export function getHolidaysInMonth(year: number, month: number): Holiday[] {
    return turkishHolidays2026.filter(holiday => {
        const [y, m] = holiday.date.split('-').map(Number)
        return y === year && m === month + 1 // month is 0-indexed
    })
}

/**
 * Get holiday color based on type
 */
export function getHolidayColor(type: 'national' | 'religious'): {
    bg: string
    text: string
    border: string
} {
    if (type === 'national') {
        return {
            bg: 'bg-red-500/10',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-500/30'
        }
    }
    return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-500/30'
    }
}
