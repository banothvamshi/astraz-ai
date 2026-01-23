
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Robust .env loader
function loadEnv() {
    const envFiles = [
        '.env.local',
        '.env',
        '.env.development.local',
        '.env.test.local',
        '.env.production.local'
    ];

    let loaded = false;

    for (const file of envFiles) {
        try {
            const envPath = path.resolve(process.cwd(), file);
            if (fs.existsSync(envPath)) {
                console.log(`Loading environment from ${file}...`);
                const envContent = fs.readFileSync(envPath, 'utf8');
                envContent.split('\n').forEach(line => {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        const value = match[2].trim().replace(/^["']|["']$/g, '');
                        if (!process.env[key]) {
                            process.env[key] = value;
                        }
                    }
                });
                loaded = true;
            }
        } catch (e) {
            // Ignore errors for optional files
        }
    }

    if (!loaded && !process.env.GOOGLE_GEMINI_API_KEY) {
        console.warn("⚠️  No .env files found and GOOGLE_GEMINI_API_KEY not set.");
    }
}

loadEnv();

// Try both standard and Next.js public prefix
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ Error: GOOGLE_GEMINI_API_KEY (or NEXT_PUBLIC_...) is not set.");
    console.error("Please ensure you have a .env or .env.local file with this key.");
    process.exit(1);
}

console.log(`Checking models for API Key: ${apiKey.substring(0, 8)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`❌ API Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
            process.exit(1);
        }

        try {
            const json = JSON.parse(data);
            const models = json.models || [];

            console.log("\n✅ AVAILABLE GEMINI MODELS:");
            console.log("=".repeat(50));

            const flashModels = models.filter((m: any) => m.name.includes("flash"));
            const proModels = models.filter((m: any) => m.name.includes("pro"));
            const otherModels = models.filter((m: any) => !m.name.includes("flash") && !m.name.includes("pro"));

            console.log("\n⚡ FLASH MODELS (Fast & Efficient):");
            flashModels.forEach((m: any) => console.log(`  - ${m.name.replace('models/', '')} (${m.displayName})`));

            console.log("\n🧠 PRO MODELS (High Intelligence):");
            proModels.forEach((m: any) => console.log(`  - ${m.name.replace('models/', '')} (${m.displayName})`));

            console.log("\nOther Models:");
            otherModels.forEach((m: any) => console.log(`  - ${m.name.replace('models/', '')}`));

            console.log("\n" + "=".repeat(50));

            // Check for Gemini 2.0 specifically
            const hasGemini2 = models.some((m: any) => m.name.includes("gemini-2.0"));
            if (hasGemini2) {
                console.log("\n🎉 GREAT NEWS! You have access to Gemini 2.0 models!");
                console.log("Recommend using: gemini-2.0-flash-exp");
            } else {
                console.log("\n⚠️ Note: Gemini 2.0 models not found in this list.");
            }

        } catch (e: any) {
            console.error("Failed to parse response:", e.message);
        }
    });

}).on('error', (e) => {
    console.error("Network error:", e.message);
});
