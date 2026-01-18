/**
 * Advanced PDF Parsing Endpoint
 * Uses Gemini Layout Parser with custom schemas
 */

import { NextRequest, NextResponse } from "next/server";
import {
  extractResumeData,
  extractJobDescriptionData,
  extractInvoiceData,
  extractContractData,
  validateExtractionResults,
  ExtractionExamples,
} from "@/lib/gemini-layout-parser-examples";

interface AdvancedParseRequest {
  pdf: string; // base64 PDF
  documentType?: "resume" | "job" | "invoice" | "contract" | "custom";
  customSchema?: Record<string, any>;
  customInstructions?: string;
  validateSchema?: boolean;
  returnStructure?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: AdvancedParseRequest = await request.json();
    const {
      pdf,
      documentType = "custom",
      customSchema,
      customInstructions,
      validateSchema = false,
      returnStructure = true,
    } = body;

    if (!pdf) {
      return NextResponse.json(
        { error: "PDF (base64) is required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(70));
    console.log("ADVANCED PDF PARSING WITH GEMINI LAYOUT");
    console.log(`Document Type: ${documentType}`);
    console.log("=".repeat(70));

    // Convert base64 to buffer
    const base64Data = pdf.includes(",") ? pdf.split(",")[1] : pdf;
    const pdfBuffer = Buffer.from(base64Data, "base64");

    console.log(`PDF Size: ${pdfBuffer.length} bytes`);

    let result: any;

    // Route to appropriate extractor
    switch (documentType) {
      case "resume":
        console.log("Using resume extraction schema...");
        result = await extractResumeData(pdfBuffer);
        break;

      case "job":
        console.log("Using job description extraction schema...");
        result = await extractJobDescriptionData(pdfBuffer);
        break;

      case "invoice":
        console.log("Using invoice extraction schema...");
        result = await extractInvoiceData(pdfBuffer);
        break;

      case "contract":
        console.log("Using contract extraction schema...");
        result = await extractContractData(pdfBuffer);
        break;

      case "custom":
        if (!customSchema) {
          return NextResponse.json(
            {
              error: "Custom schema required for 'custom' document type",
              availableSchemas: [
                "resume",
                "job",
                "invoice",
                "contract",
              ],
            },
            { status: 400 }
          );
        }
        console.log("Using custom extraction schema...");
        const { analyzePDFWithLayout } = await import("@/lib/gemini-layout-parser");
        result = await analyzePDFWithLayout(
          pdfBuffer,
          customSchema,
          customInstructions
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown document type: ${documentType}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Build response
    const response: any = {
      success: true,
      documentType,
    };

    // Include extracted data
    if (result.data) {
      response.data = result.data;
      console.log("✅ Structured data extracted");

      // Validate if requested
      if (validateSchema && customSchema) {
        const schema =
          documentType === "custom"
            ? customSchema
            : (ExtractionExamples as any)[`${documentType}ExtractionSchema`];

        if (schema) {
          const validation = validateExtractionResults(result.data, schema);
          response.validation = validation;

          if (!validation.valid) {
            console.log(`⚠️  Validation warnings:`);
            if (validation.missingFields.length > 0) {
              console.log(`  Missing: ${validation.missingFields.join(", ")}`);
            }
            if (validation.invalidFields.length > 0) {
              console.log(`  Invalid: ${validation.invalidFields.join(", ")}`);
            }
          } else {
            console.log("✅ Schema validation passed");
          }
        }
      }
    }

    // Include document structure if requested
    if (returnStructure) {
      if (result.documentTree) {
        // Create simplified tree for response (limit depth)
        response.structure = simplifyTree(result.documentTree, 3);

        if (result.extractedElements) {
          response.elementSummary = {
            total: countAllElements(result.documentTree),
            byType: {
              headers: result.extractedElements.headers.length,
              paragraphs: result.extractedElements.paragraphs.length,
              lists: result.extractedElements.lists.length,
              tables: result.extractedElements.tables.length,
            },
          };

          console.log(`✅ Document structure extracted (${response.elementSummary.total} elements)`);
        }
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("PARSING COMPLETE");
    console.log("=".repeat(70) + "\n");

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Simplify tree for JSON response (limit depth)
 */
function simplifyTree(node: any, maxDepth: number, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    return null;
  }

  const simplified: any = {
    type: node.type,
  };

  if (node.content) {
    simplified.content =
      node.content.length > 100 ? node.content.substring(0, 100) + "..." : node.content;
  }

  if (node.level) {
    simplified.level = node.level;
  }

  if (node.children && node.children.length > 0) {
    simplified.childCount = node.children.length;
    simplified.children = node.children
      .slice(0, 5) // Only first 5 children
      .map((child: any) => simplifyTree(child, maxDepth, currentDepth + 1))
      .filter((c: any) => c !== null);
  }

  return simplified;
}

/**
 * Count all elements in tree
 */
function countAllElements(node: any): number {
  let count = 1;
  if (node.children) {
    node.children.forEach((child: any) => {
      count += countAllElements(child);
    });
  }
  return count;
}

/**
 * GET: Return available schemas
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Gemini Layout Parser API",
    availableDocumentTypes: [
      {
        type: "resume",
        description: "Resume/CV parsing with personal info, experience, education, skills",
      },
      {
        type: "job",
        description: "Job description parsing with title, responsibilities, qualifications",
      },
      {
        type: "invoice",
        description: "Invoice/receipt parsing with vendor, items, totals",
      },
      {
        type: "contract",
        description: "Contract/agreement parsing with parties, terms, obligations",
      },
      {
        type: "custom",
        description: "Custom schema-based parsing (provide customSchema in body)",
      },
    ],
    usage: {
      endpoint: "POST /api/advanced-parse",
      body: {
        pdf: "base64_encoded_pdf",
        documentType: "resume | job | invoice | contract | custom",
        customSchema:
          "{ your_field: 'string', nested: { field: 'number' } } (if custom)",
        customInstructions:
          "Additional extraction instructions (optional)",
        validateSchema: true, // Validate output against schema
        returnStructure: true, // Return document structure tree
      },
    },
    examples: {
      resume: {
        documentType: "resume",
        pdf: "base64_pdf",
      },
      customInvoice: {
        documentType: "custom",
        pdf: "base64_pdf",
        customSchema: {
          invoice_number: "string",
          total_amount: "number",
        },
      },
    },
  });
}
