import { jsPDF } from "jspdf";

export interface PDFOptions {
  type: "resume" | "coverLetter";
  content: string;
  name?: string;
  email?: string;
}

/**
 * Generates a PREMIUM, professional-quality PDF from markdown content.
 * Optimized for ATS compatibility and human readability.
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;
  const lineHeight = 6; // Optimized line height
  const paragraphSpacing = 4; // Space between paragraphs
  const sectionSpacing = 8; // Space between sections

  // Set professional fonts
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Add premium header for resume
  if (type === "resume" && name && email) {
    y = addPremiumResumeHeader(doc, name, email, margin, pageWidth);
    y += sectionSpacing;
  } else if (type === "coverLetter" && name && email) {
    // Cover letter header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(name, margin, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.text(email, margin, y);
    y += sectionSpacing;
    
    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(dateStr, margin, y);
    y += sectionSpacing + 5;
  } else {
    y += 10;
  }

  const parsedSections = parseMarkdownContent(content);

  for (const section of parsedSections) {
    // Check for new page
    const estimatedHeight = section.type === "heading" ? 15 : section.type === "list" ? section.items!.length * lineHeight + 10 : 20;
    if (y + estimatedHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      // Re-add header if it's a resume
      if (type === "resume" && name && email) {
        y = addPremiumResumeHeader(doc, name, email, margin, pageWidth);
        y += sectionSpacing;
      }
    }

    if (section.type === "heading") {
      // Main section heading (H1)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const headingText = section.content.trim();
      doc.text(headingText, margin, y);
      y += lineHeight + 3;
      
      // Add subtle underline for main sections
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 3;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    } else if (section.type === "paragraph") {
      const lines = doc.splitTextToSize(section.content, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + paragraphSpacing;
    } else if (section.type === "list") {
      section.items!.forEach((item, index) => {
        // Check for new page before each item
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
          if (type === "resume" && name && email) {
            y = addPremiumResumeHeader(doc, name, email, margin, pageWidth);
            y += sectionSpacing;
          }
        }
        
        const bullet = "• ";
        const itemText = item.trim();
        const itemLines = doc.splitTextToSize(bullet + itemText, maxWidth - 8);
        
        // Indent list items
        doc.text(itemLines, margin + 5, y);
        y += itemLines.length * lineHeight;
      });
      y += paragraphSpacing;
    }
  }

  // Generate PDF buffer
  return Buffer.from(doc.output("arraybuffer"));
}

interface ParsedSection {
  type: "heading" | "paragraph" | "list";
  content: string;
  items?: string[];
}

function parseMarkdownContent(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n").map((line) => line.trim());
  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

    // Handle headings
    if (line.startsWith("#")) {
      // Flush current paragraph/list
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      const headingText = line.replace(/^#+\s*/, "").trim();
      sections.push({ type: "heading", content: headingText });
    }
    // Handle list items
    else if (line.startsWith("- ") || line.startsWith("* ") || /^\d+\.\s/.test(line)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      const itemText = line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (itemText.length > 0) {
        currentList.push(itemText);
      }
    }
    // Handle empty lines
    else if (line.length === 0) {
      // Flush current list or paragraph
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }
    }
    // Handle regular text (paragraphs)
    else {
      // Flush current list
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }

      currentParagraph.push(line);
    }
  }

  // Flush remaining content
  if (currentList.length > 0) {
    sections.push({ type: "list", items: currentList, content: "" });
  }
  if (currentParagraph.length > 0) {
    sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
  }

  return sections;
}

function addPremiumResumeHeader(
  doc: jsPDF,
  name: string,
  email: string,
  margin: number,
  pageWidth: number
): number {
  let y = margin;

  // Name - Large, bold, centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const nameWidth = doc.getTextWidth(name);
  doc.text(name, (pageWidth - nameWidth) / 2, y);
  y += 8;

  // Contact info - Smaller, centered
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Email
  const emailWidth = doc.getTextWidth(email);
  doc.text(email, (pageWidth - emailWidth) / 2, y);
  y += 5;

  // Add subtle divider line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  return y;
}
