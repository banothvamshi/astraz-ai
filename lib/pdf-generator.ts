import { jsPDF } from "jspdf";

/**
 * Premium PDF generator for resumes and cover letters
 */
export interface PDFOptions {
  type: "resume" | "coverLetter";
  content: string;
  name?: string;
  email?: string;
}

/**
 * Generate a professional-grade PDF
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email } = options;

  // Parse markdown content into structured format
  const parsedContent = parseMarkdownContent(content);

  // Create PDF with professional settings
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  let y = margin;

  // Add header with name/contact info for resume
  if (type === "resume" && name) {
    y = addResumeHeader(doc, name, email || "", margin, contentWidth, y);
    y += 5; // Space after header
  }

  // Add content
  y = addContent(doc, parsedContent, margin, contentWidth, y, pageHeight - margin);

  // Add page numbers
  addPageNumbers(doc, pageHeight);

  // Generate buffer
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Parse markdown content into structured format
 */
interface ParsedSection {
  type: "heading" | "paragraph" | "list";
  level?: number;
  content?: string;
  items?: string[];
}

function parseMarkdownContent(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  for (const line of lines) {
    // Headings
    if (line.startsWith("#")) {
      const level = (line.match(/^#+/) || [""])[0].length;
      const text = line.replace(/^#+\s*/, "").trim();
      sections.push({ type: "heading", level, content: text });
    }
    // List items
    else if (line.match(/^[-*•]\s/)) {
      const text = line.replace(/^[-*•]\s*/, "").trim();
      const lastSection = sections[sections.length - 1];
      if (lastSection?.type === "list") {
        lastSection.items?.push(text);
      } else {
        sections.push({ type: "list", items: [text] });
      }
    }
    // Paragraphs
    else {
      const lastSection = sections[sections.length - 1];
      if (lastSection?.type === "paragraph") {
        lastSection.content += " " + line;
      } else {
        sections.push({ type: "paragraph", content: line });
      }
    }
  }

  return sections;
}

/**
 * Add professional resume header
 */
function addResumeHeader(
  doc: jsPDF,
  name: string,
  email: string,
  margin: number,
  width: number,
  y: number
): number {
  // Name - Large, bold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(name, margin, y, { align: "left", maxWidth: width });

  y += 8;

  // Contact info - Smaller, regular
  if (email) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(email, margin, y, { align: "left", maxWidth: width });
    y += 5;
  }

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + width, y);
  y += 3;

  return y;
}

/**
 * Add content sections
 */
function addContent(
  doc: jsPDF,
  sections: ParsedSection[],
  margin: number,
  width: number,
  startY: number,
  maxY: number
): number {
  let y = startY;

  for (const section of sections) {
    // Check if we need a new page
    if (y > maxY - 20) {
      doc.addPage();
      y = 20;
    }

    switch (section.type) {
      case "heading":
        y = addHeading(doc, section.content || "", section.level || 1, margin, width, y);
        break;
      case "paragraph":
        y = addParagraph(doc, section.content || "", margin, width, y, maxY);
        break;
      case "list":
        y = addList(doc, section.items || [], margin, width, y, maxY);
        break;
    }
  }

  return y;
}

/**
 * Add heading
 */
function addHeading(
  doc: jsPDF,
  text: string,
  level: number,
  margin: number,
  width: number,
  y: number
): number {
  const fontSize = level === 1 ? 14 : level === 2 ? 12 : 10;
  const fontWeight = level <= 2 ? "bold" : "normal";

  doc.setFont("helvetica", fontWeight);
  doc.setFontSize(fontSize);
  doc.setTextColor(30, 30, 30);

  // Add spacing before heading
  if (y > 25) {
    y += level === 1 ? 8 : 5;
  }

  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, margin, y, { align: "left", maxWidth: width });
  y += lines.length * (fontSize * 0.4) + 3;

  return y;
}

/**
 * Add paragraph
 */
function addParagraph(
  doc: jsPDF,
  text: string,
  margin: number,
  width: number,
  y: number,
  maxY: number
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  const lines = doc.splitTextToSize(text, width);
  
  for (const line of lines) {
    if (y + 5 > maxY) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, margin, y, { align: "left", maxWidth: width });
    y += 5;
  }

  y += 2; // Space after paragraph
  return y;
}

/**
 * Add list
 */
function addList(
  doc: jsPDF,
  items: string[],
  margin: number,
  width: number,
  y: number,
  maxY: number
): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  const bulletX = margin;
  const textX = margin + 5;
  const textWidth = width - 5;

  for (const item of items) {
    if (y + 5 > maxY) {
      doc.addPage();
      y = 20;
    }

    // Bullet point
    doc.setFillColor(60, 60, 60);
    doc.circle(bulletX + 2, y - 1.5, 1, "F");

    // Text
    const lines = doc.splitTextToSize(item, textWidth);
    doc.text(lines, textX, y, { align: "left", maxWidth: textWidth });
    y += lines.length * 5 + 2;
  }

  y += 2; // Space after list
  return y;
}

/**
 * Add page numbers
 */
function addPageNumbers(doc: jsPDF, pageHeight: number): void {
  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
}
