import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'generations.jsonl');

// Ensure data directory exists ONLY if not in production and not in a serverless environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (!isProduction) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (e) {
        // Fallback if we can't create directory even in dev (e.g. permission issues)
        console.warn('Could not create data directory, falling back to console logging');
    }
}

export interface GenerationLog {
    timestamp: string;
    clientId: string;
    isPremium: boolean;
    resumeData?: any;
    jobDescription?: any;
    generatedResume?: string;
    generatedCoverLetter?: string;
    contactInfo?: any;
    error?: string;
}

/**
 * Log generation data for future training/analytics.
 * 
 * STRATEGY:
 * - Local Development: Append to 'data/generations.jsonl' for easy access
 * - Production/Serverless: Log to stdout/stderr as JSON. Log drains (e.g. Datadog, CloudWatch) will capture this.
 *   This avoids 'EROENT' or 'Read-only filesystem' errors in lambda environments.
 */
export async function logGenerationData(data: Omit<GenerationLog, 'timestamp'>) {
    const logEntry: GenerationLog = {
        timestamp: new Date().toISOString(),
        ...data,
    };

    // 1. Always log to console in a structured format for cloud log collectors
    // Use a special prefix or structure so it's easy to filter
    console.log('DATA_COLLECTION_EVENT:', JSON.stringify(logEntry));

    // 2. In local development, also save to file for convenience
    if (!isProduction) {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            // Check if directory exists before writing
            if (fs.existsSync(DATA_DIR)) {
                await fs.promises.appendFile(LOG_FILE, logLine, 'utf8');
            }
        } catch (error) {
            // If file write fails, we already logged to console, so just warn
            console.warn('Failed to write to local data file:', error);
        }
    }
}
