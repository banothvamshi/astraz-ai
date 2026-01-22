
/**
 * Advanced Experience Calculator
 * accurately calculates total years of experience from resume text
 * handling overlapping dates and various date formats.
 */

export function calculateTotalExperience(text: string): { totalYears: number; details: string } {
    if (!text) return { totalYears: 0, details: "0 years" };

    // 1. Extract Experience Section (if possible, to reduce noise)
    // If we can't isolate it, we scan the whole text but risk false positives (e.g. education dates)
    // Ideally, we accept the "Experience" section content specifically. 
    // For now, we'll try to find the section or just scan the whole thing if short.

    // Normalize text
    const normalized = text.toLowerCase().replace(/\s+/g, ' ');

    // 2. Date Parsers
    interface DateRange {
        start: Date;
        end: Date;
    }

    const ranges: DateRange[] = [];
    const now = new Date();

    // Regex for "Month Year - Month Year" or "Month Year - Present"
    // Matches: Jan 2020 - Feb 2021, 01/2020 - Present, etc.
    const monthNames = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
    const yearPattern = "(?:19|20)\\d{2}";
    const datePattern = `(${monthNames}|\\d{1,2})[\\/\\s-]*(${yearPattern})`; // Group 1: Month, Group 2: Year

    // Separator: " - ", " to ", " – "
    const separator = "\\s*(?:-|–|to)\\s*";
    const endPattern = `(${datePattern}|present|current|now)`;

    // Full Regex
    const rangeRegex = new RegExp(`(${datePattern})${separator}${endPattern}`, 'gi');

    let match;
    while ((match = rangeRegex.exec(text)) !== null) {
        try {
            // Start Date
            const startStr = match[1]; // Full start string needed? No, match[2] is month, match[3] is year if logic holds? 

            const startMonth = parseMonth(match[2]);
            const startYear = parseInt(match[3]);
            const startDate = new Date(startYear, startMonth, 1);

            let endDate = now;
            const endFull = match[4].toLowerCase();

            if (!['present', 'current', 'now'].includes(endFull)) {
                const endMonth = parseMonth(match[5]);
                const endYear = parseInt(match[6]);
                endDate = new Date(endYear, endMonth + 1, 0); // End of month
            }

            if (isValidDate(startDate) && isValidDate(endDate) && startDate <= endDate) {
                // Filter out dates far in past (before 1980) or future
                if (startDate.getFullYear() > 1980 && startDate <= now) {
                    ranges.push({ start: startDate, end: endDate });
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    if (ranges.length === 0) {
        // Fallback text check for "X years experience"
        const mentionMatch = text.match(/(\d+(?:\.\d+)?)\+?\s*years?/i);
        if (mentionMatch) {
            return { totalYears: parseFloat(mentionMatch[1]), details: "extracted from text mention" };
        }
        return { totalYears: 0, details: "No dates found" };
    }

    // 3. Merge Overlapping Ranges & Calculate Gap-Aware Total
    // Sort by start date
    ranges.sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: DateRange[] = [];
    if (ranges.length > 0) {
        let current = ranges[0];

        for (let i = 1; i < ranges.length; i++) {
            const next = ranges[i];

            if (next.start < current.end) {
                // Overlap or adjacent
                if (next.end > current.end) {
                    current.end = next.end; // Extend end
                }
            } else {
                // No overlap
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);
    }

    // 4. Calculate Total Duration
    let totalMonths = 0;

    merged.forEach((r, i) => {
        const duration = (r.end.getFullYear() - r.start.getFullYear()) * 12 + (r.end.getMonth() - r.start.getMonth());
        totalMonths += Math.max(0, duration);
    });

    const totalYears = parseFloat((totalMonths / 12).toFixed(1));

    // Calculate span for sanity check
    const careerSpanYears = merged.length > 0
        ? parseFloat(((merged[merged.length - 1].end.getTime() - merged[0].start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1))
        : 0;

    return {
        totalYears,
        details: `${totalYears} yoe (span ${careerSpanYears}y, ${merged.length} roles)`
    };
}

function parseMonth(str: string): number {
    if (!str) return 0;

    // Numeric
    if (/^\d+$/.test(str)) {
        return Math.max(0, parseInt(str) - 1);
    }

    // Text
    const s = str.toLowerCase().substring(0, 3);
    const months: Record<string, number> = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    return months[s] || 0;
}

function isValidDate(d: Date): boolean {
    return d instanceof Date && !isNaN(d.getTime());
}
