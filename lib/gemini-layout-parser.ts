/**
 * Gemini Layout Parser with Multimodal Analysis
 * Uses Gemini Vision API to understand PDF structure and extract data
 */

import * as fs from "fs";
import * as path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface TreeNode {
  type: "document" | "header" | "paragraph" | "list" | "table" | "image" | "section";
  level?: number; // For headers (1-6)
  content?: string;
  children?: TreeNode[];
  metadata?: {
    startPage?: number;
    endPage?: number;
    confidence?: number;
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

interface ExtractionSchema {
  [key: string]: string | ExtractionSchema;
}

interface ExtractionResult {
  success: boolean;
  data?: Record<string, any>;
  documentTree?: TreeNode;
  extractedElements?: {
    headers: Array<{ level: number; text: string }>;
    paragraphs: string[];
    lists: Array<{ items: string[] }>;
    tables: Array<{ rows: string[][] }>;
    sections: string[];
  };
  rawAnalysis?: string;
  error?: string;
}

/**
 * Initialize Gemini client
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Convert PDF buffer to base64
 */
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

/**
 * Analyze PDF structure using Gemini Vision
 */
export async function analyzePDFStructure(pdfBuffer: Buffer): Promise<{
  analysis: string;
  elements: {
    headers: Array<{ level: number; text: string }>;
    paragraphs: string[];
    lists: Array<{ items: string[] }>;
    tables: Array<{ rows: string[][] }>;
    sections: string[];
  };
}> {
  const genAI = getGeminiClient();
  const base64Pdf = bufferToBase64(pdfBuffer);

  const prompt = `Analyze the structure of this PDF document and identify all elements. 

For each element, provide:
1. HEADERS: Identify all headers/headings with their hierarchy level (H1-H6)
2. PARAGRAPHS: List all paragraph text blocks
3. LISTS: Identify bullet points, numbered lists with their items
4. TABLES: Describe table structure and content
5. SECTIONS: Identify major sections and their organization

Format your response as JSON with the following structure:
{
  "headers": [{"level": 1, "text": "..."}],
  "paragraphs": ["..."],
  "lists": [{"items": ["item1", "item2"]}],
  "tables": [{"rows": [["cell1", "cell2"], ["cell3", "cell4"]]}],
  "sections": ["section1", "section2"]
}

Also provide a brief structural analysis explaining the document layout.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Pdf,
      },
    },
    prompt,
  ]);

  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  let parsedElements = {
    headers: [],
    paragraphs: [],
    lists: [],
    tables: [],
    sections: [],
  };

  if (jsonMatch) {
    try {
      parsedElements = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse structure JSON:", e);
    }
  }

  return {
    analysis: responseText,
    elements: parsedElements,
  };
}

/**
 * Build a tree representation of the document
 */
export function buildDocumentTree(elements: {
  headers: Array<{ level: number; text: string }>;
  paragraphs: string[];
  lists: Array<{ items: string[] }>;
  tables: Array<{ rows: string[][] }>;
  sections: string[];
}): TreeNode {
  const root: TreeNode = {
    type: "document",
    children: [],
  };

  let currentSection: TreeNode | null = null;
  let currentLevel = 0;

  // Add headers and build hierarchy
  elements.headers.forEach((header) => {
    const headerNode: TreeNode = {
      type: "header",
      level: header.level,
      content: header.text,
      children: [],
    };

    if (header.level === 1) {
      root.children?.push(headerNode);
      currentSection = headerNode;
      currentLevel = 1;
    } else if (header.level <= currentLevel && currentSection) {
      root.children?.push(headerNode);
      currentSection = headerNode;
      currentLevel = header.level;
    } else if (currentSection) {
      currentSection.children?.push(headerNode);
      currentLevel = header.level;
    }
  });

  // Add paragraphs
  elements.paragraphs.forEach((para) => {
    const paraNode: TreeNode = {
      type: "paragraph",
      content: para,
    };
    if (currentSection) {
      currentSection.children?.push(paraNode);
    } else {
      root.children?.push(paraNode);
    }
  });

  // Add lists
  elements.lists.forEach((list) => {
    const listNode: TreeNode = {
      type: "list",
      children: list.items.map((item) => ({
        type: "paragraph" as const,
        content: item,
      })),
    };
    if (currentSection) {
      currentSection.children?.push(listNode);
    } else {
      root.children?.push(listNode);
    }
  });

  // Add tables
  elements.tables.forEach((table) => {
    const tableNode: TreeNode = {
      type: "table",
      children: table.rows.map((row) => ({
        type: "paragraph" as const,
        content: row.join(" | "),
      })),
    };
    if (currentSection) {
      currentSection.children?.push(tableNode);
    } else {
      root.children?.push(tableNode);
    }
  });

  return root;
}

/**
 * Extract fields using multimodal Gemini prompt
 */
export async function extractStructuredData(
  pdfBuffer: Buffer,
  schema: ExtractionSchema,
  instructions?: string
): Promise<Record<string, any>> {
  const genAI = getGeminiClient();
  const base64Pdf = bufferToBase64(pdfBuffer);

  const schemaJson = JSON.stringify(schema, null, 2);

  const extractionPrompt = `Extract data from this PDF document and return it in the following JSON schema:

${schemaJson}

${instructions ? `Additional instructions: ${instructions}` : ""}

IMPORTANT:
1. Extract ONLY information that exists in the document
2. Use exact values from the PDF, do not fabricate data
3. For missing fields, use null
4. For lists/arrays, extract all items
5. For nested objects, follow the schema structure exactly
6. Return ONLY valid JSON, no additional text

Extracted JSON:`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Pdf,
      },
    },
    extractionPrompt,
  ]);

  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to extract structured data from response");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse extracted data:", e);
    console.error("Response text:", responseText);
    throw new Error("Invalid JSON in extraction response");
  }
}

/**
 * Comprehensive PDF analysis with layout understanding
 */
export async function analyzePDFWithLayout(
  pdfBuffer: Buffer,
  schema?: ExtractionSchema,
  instructions?: string
): Promise<ExtractionResult> {
  try {
    // Step 1: Analyze document structure
    console.log("Step 1: Analyzing PDF structure...");
    const structureAnalysis = await analyzePDFStructure(pdfBuffer);

    // Step 2: Build document tree
    console.log("Step 2: Building document tree...");
    const documentTree = buildDocumentTree(structureAnalysis.elements);

    // Step 3: Extract structured data if schema provided
    let extractedData: Record<string, any> | undefined;
    if (schema) {
      console.log("Step 3: Extracting structured data...");
      extractedData = await extractStructuredData(pdfBuffer, schema, instructions);
    }

    return {
      success: true,
      data: extractedData,
      documentTree,
      extractedElements: structureAnalysis.elements,
      rawAnalysis: structureAnalysis.analysis,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Pretty print document tree
 */
export function printDocumentTree(node: TreeNode, indent = 0): string {
  const prefix = "  ".repeat(indent);
  let output = "";

  if (node.type === "document") {
    output += `${prefix}📄 Document\n`;
  } else if (node.type === "header") {
    output += `${prefix}📋 Header (H${node.level}): ${node.content}\n`;
  } else if (node.type === "paragraph") {
    output += `${prefix}📝 Paragraph: ${node.content?.substring(0, 60)}...\n`;
  } else if (node.type === "list") {
    output += `${prefix}📌 List\n`;
  } else if (node.type === "table") {
    output += `${prefix}📊 Table\n`;
  }

  if (node.children) {
    node.children.forEach((child) => {
      output += printDocumentTree(child, indent + 1);
    });
  }

  return output;
}

/**
 * Export tree as JSON
 */
export function exportTreeAsJSON(node: TreeNode): string {
  return JSON.stringify(node, null, 2);
}

/**
 * Find elements by type in tree
 */
export function findElementsByType(
  node: TreeNode,
  type: string
): TreeNode[] {
  const results: TreeNode[] = [];

  if (node.type === type) {
    results.push(node);
  }

  if (node.children) {
    node.children.forEach((child) => {
      results.push(...findElementsByType(child, type));
    });
  }

  return results;
}

/**
 * Extract text content from tree
 */
export function extractTextFromTree(node: TreeNode): string {
  let text = node.content || "";

  if (node.children) {
    node.children.forEach((child) => {
      const childText = extractTextFromTree(child);
      if (childText) {
        text += "\n" + childText;
      }
    });
  }

  return text;
}
