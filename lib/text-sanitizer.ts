/**
 * Advanced Text Sanitizer Engine ("The Optical Nerve")
 * 
 * A deterministic engine to clean OCR artifacts, normalize text, and prepare
 * high-quality input for the AI. This ensures "Garbage In" becomes "Clean In".
 */

export function sanitizeText(text: string): string {
    if (!text) return "";

    let clean = text;

    // 1. Normalize Ligatures & Special Chars
    clean = normalizeLigatures(clean);

    // 2. Fix Wide Spacing (e.g. "E X P E R I E N C E" -> "EXPERIENCE")
    clean = fixWideSpacing(clean);

    // 3. Split Merged CamelCase (e.g. "SoftwareEngineer" -> "Software Engineer")
    clean = splitCamelCase(clean);

    // 4. Filter Garbage Lines
    clean = filterGarbageLines(clean);

    // 5. Standardize Whitespace
    clean = clean.replace(/[ \t]+/g, " ").trim();

    return clean;
}

/**
 * Replaces common OCR ligatures and weird quotes with standard ASCII
 */
function normalizeLigatures(text: string): string {
    return text
        .replace(/ﬁ/g, "fi")
        .replace(/ﬂ/g, "fl")
        .replace(/’/g, "'")
        .replace(/‘/g, "'")
        .replace(/“/g, '"')
        .replace(/”/g, '"')
        .replace(/–/g, "-")
        .replace(/—/g, "-")
        .replace(/…/g, "...");
}

/**
 * Detects and fixes wide-spaced text often found in PDF headers.
 * Strategy: Look for sequences of single letters separated by spaces.
 */
function fixWideSpacing(text: string): string {
    // Regex matches 3+ single letters separated by spaces (e.g. "S U M M A R Y")
    // Use a negative lookahead to avoid destroying actual single letter lists if they exist (rare in prose)
    return text.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])(\s+[A-Z])+\b/g, (match) => {
        return match.replace(/\s+/g, "");
    });
}

/**
 * Splits merged CamelCase words often caused by PDF text layer merging.
 * e.g. "SeniorManager" -> "Senior Manager"
 * e.g. "JavaScript" -> "JavaScript" (Should PRESERVE valid CamelCase)
 * 
 * Strategy: High confidence split only.
 * Lowercase followed immediately by Uppercase.
 */
function splitCamelCase(text: string): string {
    // We want to split "SeniorManager" but NOT "JavaScript" or "iPhone"
    // Heuristic: If the Uppercase letter is followed by a lowercase letter, it's likely a new word using Title Case.
    // e.g. "rM" in "SeniorManager" matches "r" (lower) "M" (upper) "a" (lower)
    return text.replace(/([a-z])([A-Z][a-z])/g, "$1 $2");
}

/**
 * Removes lines that are overwhelmingly non-alphanumeric (OCR noise).
 */
function filterGarbageLines(text: string): string {
    return text.split('\n').filter(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return true; // Keep empty lines for paragraph spacing

        // Count alphanumeric chars
        const alphaNumeric = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
        const total = trimmed.length;

        // If line is > 5 chars and < 30% alphanumeric, it's probably garbage (e.g. "____....;;;;")
        if (total > 5 && (alphaNumeric / total) < 0.3) {
            return false;
        }

        return true;
    }).join('\n');
}
