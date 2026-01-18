/**
 * Gemini Layout Parser - Usage Examples
 * Shows how to use the layout parser with different document types and schemas
 */

import {
  analyzePDFWithLayout,
  printDocumentTree,
  findElementsByType,
  extractTextFromTree,
} from "@/lib/gemini-layout-parser";

// ============================================
// EXAMPLE 1: Resume/CV Extraction
// ============================================
export const resumeExtractionSchema = {
  personal_info: {
    name: "string",
    email: "string",
    phone: "string",
    location: "string",
  },
  professional_summary: "string",
  experience: [
    {
      company: "string",
      position: "string",
      duration: "string",
      responsibilities: ["string"],
    },
  ],
  education: [
    {
      institution: "string",
      degree: "string",
      field: "string",
      graduation_date: "string",
    },
  ],
  skills: ["string"],
  certifications: ["string"],
};

// ============================================
// EXAMPLE 2: Job Description Extraction
// ============================================
export const jobDescriptionSchema = {
  job_title: "string",
  company: "string",
  location: "string",
  employment_type: "string",
  salary_range: "string",
  job_summary: "string",
  key_responsibilities: ["string"],
  required_qualifications: ["string"],
  preferred_qualifications: ["string"],
  required_skills: ["string"],
  benefits: ["string"],
};

// ============================================
// EXAMPLE 3: Invoice/Receipt Extraction
// ============================================
export const invoiceSchema = {
  invoice_number: "string",
  invoice_date: "string",
  due_date: "string",
  vendor: {
    name: "string",
    address: "string",
    tax_id: "string",
  },
  customer: {
    name: "string",
    address: "string",
  },
  line_items: [
    {
      description: "string",
      quantity: "number",
      unit_price: "number",
      total: "number",
    },
  ],
  subtotal: "number",
  tax: "number",
  total: "number",
  payment_terms: "string",
};

// ============================================
// EXAMPLE 4: Contract/Agreement Extraction
// ============================================
export const contractSchema = {
  document_type: "string",
  parties: ["string"],
  effective_date: "string",
  expiration_date: "string",
  term: "string",
  key_terms: {
    payment: "string",
    termination: "string",
    confidentiality: "string",
    liability: "string",
  },
  obligations: {
    party_a: ["string"],
    party_b: ["string"],
  },
  special_clauses: ["string"],
};

// ============================================
// EXAMPLE 5: Medical/Insurance Document
// ============================================
export const medicalSchema = {
  patient: {
    name: "string",
    date_of_birth: "string",
    medical_id: "string",
  },
  provider: {
    name: "string",
    license_number: "string",
  },
  visit_details: {
    date: "string",
    reason: "string",
    diagnosis: "string",
    treatment: "string",
  },
  medications: [
    {
      name: "string",
      dosage: "string",
      frequency: "string",
    },
  ],
  lab_results: {
    test_name: "string",
    result: "string",
    reference_range: "string",
  },
};

// ============================================
// EXTRACTION HELPER FUNCTIONS
// ============================================

/**
 * Extract resume data with layout understanding
 */
export async function extractResumeData(pdfBuffer: Buffer) {
  return await analyzePDFWithLayout(
    pdfBuffer,
    resumeExtractionSchema as any,
    `
    Extract resume information according to the schema.
    - If sections are not clearly labeled, infer from content
    - For dates, use format "Month Year - Month Year" or "Present"
    - Ensure all company names and positions are accurate
    - Extract all skills listed, even if under different categories
    `
  );
}

/**
 * Extract job description data
 */
export async function extractJobDescriptionData(pdfBuffer: Buffer) {
  return await analyzePDFWithLayout(
    pdfBuffer,
    jobDescriptionSchema as any,
    `
    Extract job posting information.
    - Ensure key responsibilities are complete and specific
    - Separate required vs preferred qualifications
    - List all required skills mentioned
    - Include all listed benefits
    `
  );
}

/**
 * Extract invoice data
 */
export async function extractInvoiceData(pdfBuffer: Buffer) {
  return await analyzePDFWithLayout(
    pdfBuffer,
    invoiceSchema as any,
    `
    Extract invoice/receipt information.
    - Ensure all line items are captured with correct quantities and prices
    - Calculate totals correctly
    - Extract all dates in YYYY-MM-DD format
    - Include all tax information
    `
  );
}

/**
 * Extract contract data
 */
export async function extractContractData(pdfBuffer: Buffer) {
  return await analyzePDFWithLayout(
    pdfBuffer,
    contractSchema as any,
    `
    Extract contract/agreement information.
    - Identify all parties involved
    - Extract key dates and terms
    - Identify special clauses and conditions
    - List obligations for each party
    `
  );
}

/**
 * Extract medical document data
 */
export async function extractMedicalData(pdfBuffer: Buffer) {
  return await analyzePDFWithLayout(
    pdfBuffer,
    medicalSchema as any,
    `
    Extract medical document information.
    - Protect sensitive patient information
    - Ensure medical terminology is accurate
    - Extract all medications with dosages
    - Include all lab results with reference ranges
    `
  );
}

// ============================================
// ANALYSIS HELPERS
// ============================================

/**
 * Analyze document structure and print summary
 */
export async function analyzeDocumentStructure(pdfBuffer: Buffer) {
  const result = await analyzePDFWithLayout(pdfBuffer);

  if (!result.success) {
    console.error("Analysis failed:", result.error);
    return;
  }

  console.log("\n📄 DOCUMENT STRUCTURE ANALYSIS");
  console.log("=".repeat(60));

  if (result.documentTree) {
    console.log("\nDocument Tree:");
    console.log(printDocumentTree(result.documentTree));
  }

  if (result.extractedElements) {
    const elements = result.extractedElements;
    console.log("\nElement Counts:");
    console.log(`- Headers: ${elements.headers.length}`);
    console.log(`- Paragraphs: ${elements.paragraphs.length}`);
    console.log(`- Lists: ${elements.lists.length}`);
    console.log(`- Tables: ${elements.tables.length}`);
    console.log(`- Sections: ${elements.sections.length}`);

    if (elements.headers.length > 0) {
      console.log("\nHeaders Found:");
      elements.headers.slice(0, 5).forEach((h: any) => {
        const level = typeof h === "string" ? "?" : h.level || "?";
        const text = typeof h === "string" ? h : h.text || h;
        console.log(`  [H${level}] ${text}`);
      });
    }

    if (elements.tables.length > 0) {
      console.log("\nTables Found:");
      console.log(`  ${elements.tables.length} table(s)`);
    }
  }

  console.log("\n" + "=".repeat(60));
}

/**
 * Create custom schema for specific document type
 */
export function createCustomSchema(fields: Record<string, string>) {
  return fields;
}

/**
 * Validate extraction results against schema
 */
export function validateExtractionResults(
  data: Record<string, any>,
  schema: Record<string, any>
): {
  valid: boolean;
  missingFields: string[];
  invalidFields: string[];
} {
  const missingFields: string[] = [];
  const invalidFields: string[] = [];

  function checkSchema(data: any, schema: any, path = ""): void {
    for (const [key, expectedType] of Object.entries(schema)) {
      const fullPath = path ? `${path}.${key}` : key;

      if (data[key] === undefined) {
        missingFields.push(fullPath);
      } else if (expectedType === "string" && typeof data[key] !== "string") {
        invalidFields.push(`${fullPath} (expected string, got ${typeof data[key]})`);
      } else if (expectedType === "number" && typeof data[key] !== "number") {
        invalidFields.push(`${fullPath} (expected number, got ${typeof data[key]})`);
      } else if (Array.isArray(expectedType) && !Array.isArray(data[key])) {
        invalidFields.push(`${fullPath} (expected array, got ${typeof data[key]})`);
      } else if (typeof expectedType === "object" && !Array.isArray(expectedType)) {
        if (typeof data[key] === "object") {
          checkSchema(data[key], expectedType, fullPath);
        } else {
          invalidFields.push(`${fullPath} (expected object, got ${typeof data[key]})`);
        }
      }
    }
  }

  checkSchema(data, schema);

  return {
    valid: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
  };
}

// ============================================
// EXPORT FOR TESTING
// ============================================

export const ExtractionExamples = {
  resumeExtractionSchema,
  jobDescriptionSchema,
  invoiceSchema,
  contractSchema,
  medicalSchema,
  extractResumeData,
  extractJobDescriptionData,
  extractInvoiceData,
  extractContractData,
  extractMedicalData,
  analyzeDocumentStructure,
  createCustomSchema,
  validateExtractionResults,
};
