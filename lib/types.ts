/**
 * Unified Type System for Astraz AI
 * Comprehensive types for resume parsing, job data, and generation results
 */

// =============================================================================
// CONTACT INFORMATION
// =============================================================================

/**
 * Structured contact information extracted from resumes
 */
export interface ContactInfo {
    fullName: string;
    email: string;
    phone: string;
    linkedin?: string;
    website?: string;
    github?: string;
    location?: string;
    portfolio?: string;
}

/**
 * Default empty contact info
 */
export const emptyContactInfo: ContactInfo = {
    fullName: "",
    email: "",
    phone: "",
    linkedin: undefined,
    website: undefined,
    github: undefined,
    location: undefined,
    portfolio: undefined,
};

// =============================================================================
// JOB DESCRIPTION DATA
// =============================================================================

/**
 * Structured job description data
 */
export interface ParsedJobData {
    jobTitle: string;
    companyName: string;
    location?: string;
    workMode?: "remote" | "hybrid" | "onsite" | "unknown";
    salaryRange?: string;
    experienceRequired?: string;
    educationRequired?: string;
    skills: string[];
    requirements: string[];
    responsibilities: string[];
    benefits?: string[];
    fullText: string;
}

/**
 * Default empty job data
 */
export const emptyJobData: ParsedJobData = {
    jobTitle: "",
    companyName: "",
    location: undefined,
    workMode: "unknown",
    skills: [],
    requirements: [],
    responsibilities: [],
    fullText: "",
};

// =============================================================================
// RESUME DATA
// =============================================================================

/**
 * Experience entry in a resume
 */
export interface ExperienceEntry {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    duration?: string;
    description: string[];
    achievements?: string[];
}

/**
 * Education entry in a resume
 */
export interface EducationEntry {
    degree: string;
    field?: string;
    institution: string;
    location?: string;
    graduationDate: string;
    gpa?: string;
    honors?: string[];
    details?: string[];
}

/**
 * Project entry in a resume
 */
export interface ProjectEntry {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    duration?: string;
}

/**
 * Certification entry
 */
export interface CertificationEntry {
    name: string;
    issuer?: string;
    date?: string;
    expirationDate?: string;
    credentialId?: string;
}

/**
 * Complete structured resume data
 */
export interface ResumeData {
    contact: ContactInfo;
    professionalSummary: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: string[];
    technicalSkills?: string[];
    softSkills?: string[];
    certifications: CertificationEntry[];
    projects: ProjectEntry[];
    languages?: string[];
    awards?: string[];
    publications?: string[];
    rawText: string;
    unclassifiedContent?: string;
}

/**
 * Default empty resume data
 */
export const emptyResumeData: ResumeData = {
    contact: emptyContactInfo,
    professionalSummary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    rawText: "",
};

// =============================================================================
// GENERATION INPUT/OUTPUT
// =============================================================================

/**
 * Input for resume/cover letter generation
 */
export interface GenerationInput {
    resumeBase64: string;
    jobDescription: string;
    contactOverrides?: Partial<ContactInfo>;
    jobOverrides?: Partial<ParsedJobData>;
}

/**
 * Output from resume/cover letter generation
 */
export interface GenerationResult {
    resume: string;
    coverLetter: string;
    parsedContact: ContactInfo;
    parsedJob: ParsedJobData;
    cached: boolean;
    meta?: {
        processingTime: number;
        modelUsed?: string;
    };
}

// =============================================================================
// PDF OPTIONS
// =============================================================================

/**
 * Options for PDF generation
 */
export interface PDFGenerationOptions {
    type: "resume" | "coverLetter";
    content: string;
    contact: ContactInfo;
    job?: Partial<ParsedJobData>;
    theme?: "professional" | "modern" | "minimal";
    includeLinkedIn?: boolean;
    includePhone?: boolean;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validation result for any input
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate contact info completeness
 */
export function validateContactInfo(contact: ContactInfo): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!contact.fullName || contact.fullName.trim().length < 2) {
        errors.push("Full name is required");
    }

    if (!contact.email || !isValidEmail(contact.email)) {
        errors.push("Valid email is required");
    }

    if (!contact.phone || contact.phone.trim().length < 7) {
        warnings.push("Phone number is recommended");
    }

    if (!contact.linkedin) {
        warnings.push("LinkedIn profile URL is recommended");
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Simple email validation
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
    // Allow various formats: +1-234-567-8900, (123) 456-7890, 1234567890, etc.
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    return /^\+?\d{7,15}$/.test(cleaned);
}

/**
 * Validate LinkedIn URL
 */
export function isValidLinkedIn(url: string): boolean {
    return /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i.test(url);
}

/**
 * Clean and normalize LinkedIn URL
 */
export function normalizeLinkedIn(url: string): string {
    if (!url) return "";

    // Remove trailing slash and ensure https
    let cleaned = url.trim().replace(/\/$/, "");

    if (!cleaned.startsWith("http")) {
        if (cleaned.startsWith("linkedin.com") || cleaned.startsWith("www.linkedin.com")) {
            cleaned = "https://" + cleaned;
        } else if (cleaned.startsWith("in/")) {
            cleaned = "https://linkedin.com/" + cleaned;
        } else {
            cleaned = "https://linkedin.com/in/" + cleaned;
        }
    }

    return cleaned;
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
    if (!phone) return "";

    const cleaned = phone.replace(/\D/g, "");

    // US format
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // US with country code
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // International - just add + if starts with country code
    if (cleaned.length > 10) {
        return "+" + cleaned;
    }

    return phone; // Return as-is if can't format
}
