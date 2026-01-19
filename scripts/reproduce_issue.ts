
import { normalizeResume } from "../lib/resume-normalizer";

const problematicText = `
Vamshi Banoth
India |  | banothvamshi13@gmail.com | +916302061843 | in/vamshi-banoth

Professional Summary
Versatile technology and creative professional...
`;

console.log("Testing Normalizer with Problematic Text...");
const result = normalizeResume(problematicText);

console.log("--- Extracted Data ---");
console.log("Name:", result.name);
console.log("Email:", result.email);
console.log("Phone:", result.phone);
console.log("Location:", result.location);
console.log("----------------------");

if (!result.name || !result.email) {
    console.error("FAIL: Name or Email missing!");
    process.exit(1);
} else {
    console.log("SUCCESS: Data extracted.");
}
