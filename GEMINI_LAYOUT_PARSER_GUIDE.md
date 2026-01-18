# Gemini Layout Parser - Advanced PDF Extraction

## Overview

A sophisticated PDF parsing system that uses **Gemini's multimodal capabilities** to understand document structure and extract data into JSON using custom schemas. Perfect for processing any document type with structured layout understanding.

## Features

### 🎯 Core Capabilities

- **Layout Understanding**: Identifies headers, paragraphs, lists, tables, and sections
- **Document Tree**: Creates hierarchical representation of document structure
- **Multimodal Analysis**: Uses Gemini Vision API to analyze PDF content
- **Schema-Based Extraction**: Extracts data matching your exact schema
- **Type Validation**: Validates extracted data against schema
- **Multiple Document Types**: Pre-built schemas for resumes, jobs, invoices, contracts

## Architecture

### Three-Layer Approach

```
Layer 1: PDF Analysis
├─ Convert PDF to base64
├─ Send to Gemini Vision API
└─ Extract document structure

Layer 2: Document Tree Building
├─ Parse extracted elements
├─ Build hierarchical tree
└─ Identify relationships

Layer 3: Schema-Based Extraction
├─ Apply custom schema
├─ Extract matching fields
└─ Validate results
```

## Usage

### Quick Start - Pre-built Schemas

#### Resume Extraction

```bash
POST /api/advanced-parse
Content-Type: application/json

{
  "pdf": "data:application/pdf;base64,JVBERi0xLjQK...",
  "documentType": "resume",
  "validateSchema": true,
  "returnStructure": true
}
```

**Response**:
```json
{
  "success": true,
  "documentType": "resume",
  "data": {
    "personal_info": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA"
    },
    "professional_summary": "Experienced software engineer...",
    "experience": [
      {
        "company": "TechCorp",
        "position": "Senior Engineer",
        "duration": "2020-2024",
        "responsibilities": ["Led team of 5 engineers", "Architected microservices"]
      }
    ],
    "education": [
      {
        "institution": "MIT",
        "degree": "BS",
        "field": "Computer Science",
        "graduation_date": "2019"
      }
    ],
    "skills": ["Python", "JavaScript", "AWS", "Docker"],
    "certifications": []
  },
  "elementSummary": {
    "total": 45,
    "byType": {
      "headers": 8,
      "paragraphs": 12,
      "lists": 3,
      "tables": 0
    }
  }
}
```

#### Job Description Extraction

```bash
POST /api/advanced-parse
{
  "pdf": "base64_pdf",
  "documentType": "job",
  "returnStructure": true
}
```

#### Invoice Extraction

```bash
POST /api/advanced-parse
{
  "pdf": "base64_pdf",
  "documentType": "invoice"
}
```

#### Contract Extraction

```bash
POST /api/advanced-parse
{
  "pdf": "base64_pdf",
  "documentType": "contract"
}
```

### Custom Schema Usage

Create custom extraction schemas for any document type:

```bash
POST /api/advanced-parse
{
  "pdf": "base64_pdf",
  "documentType": "custom",
  "customSchema": {
    "company_name": "string",
    "employees": [
      {
        "name": "string",
        "position": "string",
        "salary": "number"
      }
    ],
    "annual_revenue": "number",
    "founded_year": "number"
  },
  "customInstructions": "Extract company information from the document. If salary data is confidential, use null."
}
```

### Advanced Usage - Layout Parser Endpoint

For detailed layout analysis:

```bash
POST /api/gemini-layout-parse
{
  "resume": "base64_pdf",
  "schema": {
    "name": "string",
    "experience": ["string"]
  },
  "extractionInstructions": "Extract the candidate name and all job positions",
  "returnTree": true,
  "returnElements": true
}
```

**Response includes**:
- Structured extracted data matching schema
- Document tree in hierarchical JSON format
- Document tree as text preview
- Element counts by type
- Raw Gemini analysis

## Available Pre-built Schemas

### 1. Resume Schema

```typescript
{
  personal_info: {
    name: "string",
    email: "string",
    phone: "string",
    location: "string"
  },
  professional_summary: "string",
  experience: [{
    company: "string",
    position: "string",
    duration: "string",
    responsibilities: ["string"]
  }],
  education: [{
    institution: "string",
    degree: "string",
    field: "string",
    graduation_date: "string"
  }],
  skills: ["string"],
  certifications: ["string"]
}
```

### 2. Job Description Schema

```typescript
{
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
  benefits: ["string"]
}
```

### 3. Invoice Schema

```typescript
{
  invoice_number: "string",
  invoice_date: "string",
  due_date: "string",
  vendor: {
    name: "string",
    address: "string",
    tax_id: "string"
  },
  customer: {
    name: "string",
    address: "string"
  },
  line_items: [{
    description: "string",
    quantity: "number",
    unit_price: "number",
    total: "number"
  }],
  subtotal: "number",
  tax: "number",
  total: "number"
}
```

### 4. Contract Schema

```typescript
{
  document_type: "string",
  parties: ["string"],
  effective_date: "string",
  expiration_date: "string",
  term: "string",
  key_terms: {
    payment: "string",
    termination: "string",
    confidentiality: "string"
  },
  obligations: {
    party_a: ["string"],
    party_b: ["string"]
  },
  special_clauses: ["string"]
}
```

### 5. Medical Document Schema

```typescript
{
  patient: {
    name: "string",
    date_of_birth: "string",
    medical_id: "string"
  },
  provider: {
    name: "string",
    license_number: "string"
  },
  visit_details: {
    date: "string",
    reason: "string",
    diagnosis: "string",
    treatment: "string"
  },
  medications: [{
    name: "string",
    dosage: "string",
    frequency: "string"
  }]
}
```

## Document Tree Structure

The layout parser creates a hierarchical tree representation:

```json
{
  "type": "document",
  "children": [
    {
      "type": "header",
      "level": 1,
      "content": "Section Title"
    },
    {
      "type": "paragraph",
      "content": "Paragraph text..."
    },
    {
      "type": "list",
      "children": [
        { "type": "paragraph", "content": "List item 1" },
        { "type": "paragraph", "content": "List item 2" }
      ]
    },
    {
      "type": "table",
      "children": [
        { "type": "paragraph", "content": "Cell 1 | Cell 2" }
      ]
    }
  ]
}
```

## API Endpoints

### POST /api/advanced-parse

**Main endpoint for PDF parsing with schemas**

**Request**:
```typescript
{
  pdf: string;              // base64 encoded PDF
  documentType?: string;    // "resume" | "job" | "invoice" | "contract" | "custom"
  customSchema?: object;    // Required if documentType is "custom"
  customInstructions?: string;
  validateSchema?: boolean; // Default: false
  returnStructure?: boolean; // Default: true
}
```

**Response**:
```typescript
{
  success: boolean;
  documentType: string;
  data?: object;           // Extracted data
  structure?: object;      // Document tree (simplified)
  elementSummary?: {
    total: number;
    byType: {
      headers: number;
      paragraphs: number;
      lists: number;
      tables: number;
    }
  };
  validation?: {
    valid: boolean;
    missingFields: string[];
    invalidFields: string[];
  };
}
```

### POST /api/gemini-layout-parse

**Detailed layout analysis endpoint**

Returns complete document tree, element breakdown, and extracted data.

### GET /api/advanced-parse

**Get API documentation and examples**

## How It Works

### Step 1: PDF Analysis

```
Input: PDF (base64) → Gemini Vision API
↓
Output: Identified elements (headers, lists, tables, paragraphs)
```

### Step 2: Tree Construction

```
Elements → Build hierarchical tree
↓
Identify parent-child relationships
↓
Create structured representation
```

### Step 3: Schema Extraction

```
Document + Schema → Gemini Multimodal Prompt
↓
Extract matching fields
↓
Format as JSON according to schema
```

### Step 4: Validation

```
Extracted Data + Schema → Validate
↓
Check for missing fields
↓
Verify data types
↓
Report mismatches
```

## Key Advantages

✅ **Multimodal Understanding**: Understands layout, structure, and visual elements
✅ **Flexible Schemas**: Works with any custom schema you define
✅ **No Hallucination**: Only extracts data that exists in document
✅ **Type Safe**: Full TypeScript support
✅ **Hierarchical Understanding**: Captures document structure relationships
✅ **Multiple Formats**: Handles resumes, invoices, contracts, etc.
✅ **Validation**: Checks extracted data matches schema
✅ **Error Handling**: Clear error messages and logging

## Use Cases

- **Resume Parsing**: Extract candidate information
- **Job Description Analysis**: Parse requirements and skills
- **Invoice Processing**: Automate receipt/invoice extraction
- **Contract Review**: Extract key terms and obligations
- **Medical Records**: Parse patient and treatment information
- **Form Filling**: Auto-extract form data
- **Document Classification**: Identify document types
- **Data Migration**: Transfer data between systems

## Best Practices

1. **Schema Design**
   - Keep schemas simple and specific
   - Use descriptive field names
   - Include expected data types
   - Provide examples in instructions

2. **Instructions**
   - Be explicit about edge cases
   - Specify null/empty value handling
   - Include format requirements (dates, numbers)
   - Mention confidentiality concerns if applicable

3. **Validation**
   - Always validate extracted results
   - Check for required fields
   - Verify data types
   - Test with sample documents

4. **Performance**
   - Typical processing: 2-5 seconds per PDF
   - Cache results for repeated documents
   - Batch process multiple documents

## Example: Custom Document Type

```typescript
// Define your schema
const purchaseOrderSchema = {
  po_number: "string",
  vendor: {
    name: "string",
    contact: "string",
    phone: "string"
  },
  items: [{
    item_code: "string",
    description: "string",
    quantity: "number",
    unit_price: "number"
  }],
  total_amount: "number",
  delivery_date: "string",
  special_instructions: "string"
};

// Use it
fetch('/api/advanced-parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdf: base64EncodedPDF,
    documentType: 'custom',
    customSchema: purchaseOrderSchema,
    customInstructions: `
      Extract purchase order information.
      - PO number should be from the top of the document
      - Ensure all line items are captured
      - Calculate or extract the total amount
      - Delivery date format: YYYY-MM-DD
    `,
    validateSchema: true
  })
});
```

## Troubleshooting

### Issue: "Failed to extract structured data"
**Solution**: Ensure PDF contains readable text (not scanned image)

### Issue: "Missing fields in extracted data"
**Solution**: Check that fields are clearly present in document; adjust instructions

### Issue: "Invalid data types"
**Solution**: Verify schema types match expected document content

### Issue: "Invalid JSON in response"
**Solution**: Simplify schema; ensure custom instructions are clear

## Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/advanced-parse` | POST | Main parsing with pre-built or custom schemas |
| `/api/advanced-parse` | GET | Get API documentation |
| `/api/gemini-layout-parse` | POST | Detailed layout analysis |

---

**Ready to parse any PDF with structured extraction!** 🚀
