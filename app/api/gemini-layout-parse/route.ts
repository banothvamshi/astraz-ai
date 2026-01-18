/**
 * Gemini Layout Parser API Endpoint
 * Uses layout understanding for structured PDF parsing
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzePDFWithLayout,
  printDocumentTree,
  exportTreeAsJSON,
  findElementsByType,
  extractTextFromTree,
} from "@/lib/gemini-layout-parser";

interface ParseRequest {
  resume: string; // base64 PDF
  schema?: Record<string, any>; // Optional extraction schema
  extractionInstructions?: string; // Optional instructions
  returnTree?: boolean; // Return document tree
  returnElements?: boolean; // Return extracted elements
}

export async function POST(request: NextRequest) {
  try {
    const body: ParseRequest = await request.json();
    const { resume, schema, extractionInstructions, returnTree = true, returnElements = true } = body;

    if (!resume) {
      return NextResponse.json(
        { error: "Resume (base64 PDF) is required" },
        { status: 400 }
      );
    }

    console.log("\n" + "=".repeat(70));
    console.log("GEMINI LAYOUT PARSER - PDF ANALYSIS");
    console.log("=".repeat(70));

    // Convert base64 to buffer
    const base64Data = resume.includes(",") ? resume.split(",")[1] : resume;
    const pdfBuffer = Buffer.from(base64Data, "base64");

    console.log(`PDF Size: ${pdfBuffer.length} bytes`);

    // Analyze PDF with layout understanding
    const result = await analyzePDFWithLayout(
      pdfBuffer,
      schema,
      extractionInstructions
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Build response
    const response: any = {
      success: true,
      status: "PDF analyzed successfully",
    };

    // Include extracted data
    if (result.data) {
      response.extractedData = result.data;
      console.log("✅ Extracted structured data");
    }

    // Include document tree
    if (returnTree && result.documentTree) {
      response.documentTree = result.documentTree;
      response.documentTreePreview = printDocumentTree(result.documentTree);
      
      // Find different element types
      const headers = findElementsByType(result.documentTree, "header");
      const tables = findElementsByType(result.documentTree, "table");
      const lists = findElementsByType(result.documentTree, "list");
      
      response.elementCounts = {
        headers: headers.length,
        tables: tables.length,
        lists: lists.length,
        totalElements: countElements(result.documentTree),
      };
      
      console.log(`✅ Document tree created: ${response.elementCounts.totalElements} elements`);
    }

    // Include extracted elements
    if (returnElements && result.extractedElements) {
      response.elements = {
        headersCount: result.extractedElements.headers.length,
        headers: result.extractedElements.headers.slice(0, 10), // First 10
        paragraphsCount: result.extractedElements.paragraphs.length,
        paragraphsPreview: result.extractedElements.paragraphs.slice(0, 3),
        listsCount: result.extractedElements.lists.length,
        tablesCount: result.extractedElements.tables.length,
        sectionsCount: result.extractedElements.sections.length,
      };
      console.log(`✅ Elements extracted:
        - Headers: ${response.elements.headersCount}
        - Paragraphs: ${response.elements.paragraphsCount}
        - Lists: ${response.elements.listsCount}
        - Tables: ${response.elements.tablesCount}`);
    }

    // Include raw analysis
    response.analysis = result.rawAnalysis?.substring(0, 500) || "";

    console.log("\n" + "=".repeat(70));
    console.log("ANALYSIS COMPLETE");
    console.log("=".repeat(70) + "\n");

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function countElements(node: any): number {
  let count = 1;
  if (node.children) {
    node.children.forEach((child: any) => {
      count += countElements(child);
    });
  }
  return count;
}
