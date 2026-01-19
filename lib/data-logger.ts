import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'generations.jsonl');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
 * Log generation data to a local JSONL file for future training/analytics
 * This ensures even free user data is captured as requested
 */
export async function logGenerationData(data: Omit<GenerationLog, 'timestamp'>) {
    try {
        const logEntry: GenerationLog = {
            timestamp: new Date().toISOString(),
            ...data,
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        await fs.promises.appendFile(LOG_FILE, logLine, 'utf8');
    } catch (error) {
        console.error('Failed to log generation data:', error);
        // Silent failure - don't block the user
    }
}
