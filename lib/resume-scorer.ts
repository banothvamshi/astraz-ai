export interface ResumeScore {
    score: number;
    grade: string;
    breakdown: {
        contactInfo: { score: number; max: number; issues: string[] };
        sections: { score: number; max: number; missing: string[] };
        contentLength: { score: number; max: number; status: string };
        quantifiableMetrics: { score: number; max: number; count: number };
        actionVerbs: { score: number; max: number; count: number };
    };
    tips: string[];
}

export function calculateResumeScore(text: string): ResumeScore {
    let score = 0;
    const tips: string[] = [];
    const maxScore = 100;

    // 1. Contact Info (15 pts)
    const contactInfo = { score: 0, max: 15, issues: [] as string[] };
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
    const hasPhone = /[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/.test(text);
    const hasLinkedIn = /linkedin\.com\/in\//i.test(text);

    if (hasEmail) contactInfo.score += 5; else contactInfo.issues.push("Missing email address");
    if (hasPhone) contactInfo.score += 5; else contactInfo.issues.push("Missing phone number");
    if (hasLinkedIn) contactInfo.score += 5; else contactInfo.issues.push("Missing LinkedIn profile");

    score += contactInfo.score;

    // 2. Sections (25 pts)
    const sections = { score: 0, max: 25, missing: [] as string[] };
    const requiredSections = [
        { key: "Experience", patterns: [/experience/i, /employment/i, /work history/i] },
        { key: "Education", patterns: [/education/i, /academic/i] },
        { key: "Skills", patterns: [/skills/i, /technologies/i, /competencies/i] },
        { key: "Summary", patterns: [/summary/i, /objective/i, /profile/i] },
        { key: "Projects", patterns: [/projects/i, /portfolio/i] }
    ];

    let foundSections = 0;
    requiredSections.forEach(sec => {
        if (sec.patterns.some(p => p.test(text))) {
            sections.score += 5;
            foundSections++;
        } else {
            sections.missing.push(sec.key);
        }
    });

    score += sections.score;

    // 3. Content Length (10 pts)
    const contentLength = { score: 0, max: 10, status: "Good" };
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 150) {
        contentLength.score = 2;
        contentLength.status = "Too Short (< 150 words)";
        tips.push("Your resume is very short. Add more details about your experience.");
    } else if (wordCount > 1000) {
        contentLength.score = 5;
        contentLength.status = "Too Long (> 1000 words)";
        tips.push("Your resume might be too long. Aim for concise, impactful bullets.");
    } else {
        contentLength.score = 10;
        contentLength.status = "Optimal";
    }
    score += contentLength.score;

    // 4. Quantifiable Metrics (25 pts)
    // Look for numbers that likely represent metrics (Eg: 20%, $50k, 10+ years)
    const quantifiableMetrics = { score: 0, max: 25, count: 0 };
    const metricRegex = /\d+%|\$\d+|\d+\s*\+|increased by|reduced by|saved|generated/gi;
    const metrics = text.match(metricRegex) || [];
    quantifiableMetrics.count = metrics.length;

    if (metrics.length >= 5) quantifiableMetrics.score = 25;
    else if (metrics.length >= 3) quantifiableMetrics.score = 15;
    else if (metrics.length >= 1) quantifiableMetrics.score = 5;
    else tips.push("Add more numbers/metrics to prove your impact (e.g., 'Increased revenue by 20%').");

    score += quantifiableMetrics.score;

    // 5. Action Verbs (25 pts)
    const actionVerbs = { score: 0, max: 25, count: 0 };
    const weakVerbs = ["worked", "responsible for", "helped", "assisted"];
    const strongVerbs = [
        "accelerated", "achieved", "architected", "built", "created", "delivered", "developed",
        "directed", "enhanced", "established", "expanded", "generated", "improved", "increased",
        "initiated", "launched", "led", "managed", "maximized", "optimized", "orchestrated",
        "reduced", "resolved", "spearheaded", "structured", "transformed"
    ];

    let strongVerbCount = 0;
    strongVerbs.forEach(verb => {
        if (new RegExp(`\\b${verb}\\b`, 'i').test(text)) strongVerbCount++;
    });

    actionVerbs.count = strongVerbCount;
    if (strongVerbCount >= 10) actionVerbs.score = 25;
    else if (strongVerbCount >= 5) actionVerbs.score = 15;
    else if (strongVerbCount >= 2) actionVerbs.score = 5;
    else tips.push("Use strong action verbs like 'Architected' or 'Spearheaded' instead of passive language.");

    score += actionVerbs.score;

    // Determine Grade
    let grade = "F";
    if (score >= 90) grade = "A+";
    else if (score >= 80) grade = "A";
    else if (score >= 70) grade = "B";
    else if (score >= 60) grade = "C";
    else if (score >= 50) grade = "D";

    // Add section tips
    if (sections.missing.length > 0) {
        tips.push(`Consider adding these sections: ${sections.missing.join(", ")}`);
    }
    if (contactInfo.issues.length > 0) {
        tips.push(`Fix contact info: ${contactInfo.issues.join(", ")}`);
    }

    return {
        score,
        grade,
        breakdown: {
            contactInfo,
            sections,
            contentLength,
            quantifiableMetrics,
            actionVerbs
        },
        tips: tips.slice(0, 3) // Return top 3 tips
    };
}
