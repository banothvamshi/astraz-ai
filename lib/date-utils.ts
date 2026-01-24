import { format, formatDistanceToNow } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

/**
 * Format date for ADMIN view (Strictly IST - India Standard Time)
 * Used in /admin panels
 */
export function formatAdminDate(date: string | Date, dateFormat: string = 'PPpp'): string {
    const d = new Date(date);
    const timeZone = 'Asia/Kolkata'; // IST
    return formatZoned(d, dateFormat, { timeZone });
}

/**
 * Format date for USER view (Local Browser Time)
 * Used in /dashboard
 */
export function formatUserDate(date: string | Date, includeTime: boolean = true): string {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined,
    });
}

/**
 * Get relative time (e.g., "2 minutes ago")
 * Works universally as it computes difference from now
 */
export function getRelativeTime(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Get IST current time
 */
export function getISTDate(): Date {
    const now = new Date();
    const timeZone = 'Asia/Kolkata';
    const zoned = toZonedTime(now, timeZone);
    return zoned;
}
