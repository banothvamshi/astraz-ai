const fs = require('fs');
const path = require('path');

async function testCapabilities() {
    console.log('--- Checking Environment ---');
    try {
        const canvas = require('canvas');
        console.log('[OK] Canvas loaded successfully');
    } catch (e: any) {
        console.error('[FAIL] Canvas failed to load:', e.message);
    }

    try {
        const pdfjs = require('pdfjs-dist');
        console.log('[OK] PDF.js loaded successfully');
    } catch (e: any) {
        console.error('[FAIL] PDF.js failed to load:', e.message);
    }

    try {
        const pdf2json = require('pdf2json');
        console.log('[OK] pdf2json loaded successfully');
    } catch (e: any) {
        console.error('[FAIL] pdf2json failed to load:', e.message);
    }

    const pdfPath = path.join(process.cwd(), 'VamshiB Resume.pdf');
    if (fs.existsSync(pdfPath)) {
        console.log(`\n--- Testing File: ${pdfPath} ---`);
        const buffer = fs.readFileSync(pdfPath);

        // Test pdf-parse
        try {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            console.log(`[RESULT] pdf-parse text length: ${data.text.trim().length}`);
            const sample = data.text.substring(0, 100).replace(/[\r\n]+/g, ' ');
            console.log(`[SAMPLE] pdf-parse: ${sample}`);
        } catch (e: any) {
            console.log('[FAIL] pdf-parse failed:', e.message);
        }

        // Test pdf2json
        try {
            const PDFParser = require("pdf2json");
            const pdfParser = new PDFParser(null, 1);

            await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                    const rawText = pdfParser.getRawTextContent();
                    console.log(`[RESULT] pdf2json text length: ${rawText.trim().length}`);
                    const sample = rawText.substring(0, 100).replace(/[\r\n]+/g, ' ');
                    console.log(`[SAMPLE] pdf2json: ${sample}`);
                    resolve(rawText);
                });
                pdfParser.parseBuffer(buffer);
            });
        } catch (e: any) {
            console.log('[FAIL] pdf2json failed:', e.message);
        }
    } else {
        console.log('VamshiB Resume.pdf not found in root.');
    }
}

testCapabilities();
