import { jsPDF } from "jspdf";

export interface PDFOptions {
  type: "resume" | "coverLetter";
  content: string;
  name?: string;
  email?: string;
}

// Enterprise-grade professional color scheme
const COLORS = {
  primary: [15, 23, 42],       // Deep slate-900 for headers
  secondary: [51, 65, 85],    // Slate-700 for subtext
  accent: [59, 130, 246],      // Blue-500 accent
  accentLight: [147, 197, 253], // Blue-300 for highlights
  divider: [226, 232, 240],   // Slate-200 for dividers
  text: [30, 41, 59],          // Slate-800 for body text
  lightText: [100, 116, 139],  // Slate-500 for dates/locations
  background: [248, 250, 252], // Slate-50 for backgrounds
};

/**
 * Strips markdown code blocks from content
 */
function stripCodeBlocks(content: string): string {
  let cleaned = content
    .replace(/^```markdown\s*\n?/gm, "")
    .replace(/^```\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
  
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  
  return cleaned;
}

/**
 * Generates an ENTERPRISE-GRADE, premium-quality PDF from markdown content.
 * Optimized for ATS compatibility and human readability with professional design.
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email } = options;

  // Strip code blocks and clean content
  const cleanedContent = stripCodeBlocks(content);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true, // Enable compression for smaller file size
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18; // Professional margins
  const maxWidth = pageWidth - 2 * margin;
  let y = margin;
  const lineHeight = 5.8;
  const paragraphSpacing = 4;
  const sectionSpacing = 10;

  // Set professional fonts
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Add premium header for resume
  if (type === "resume" && name && email) {
    y = addEnterpriseResumeHeader(doc, name, email, margin, pageWidth);
    y += sectionSpacing;
  } else if (type === "coverLetter" && name && email) {
    // Cover letter header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(name, margin, y);
    y += lineHeight + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text(email, margin, y);
    y += sectionSpacing + 3;
    
    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(dateStr, margin, y);
    y += sectionSpacing + 6;
  } else {
    y += 10;
  }

  const parsedSections = parseMarkdownContent(cleanedContent);

  for (const section of parsedSections) {
    // Check for new page
    const estimatedHeight = section.type === "heading" ? 22 : section.type === "list" ? section.items!.length * (lineHeight + 1.2) + 12 : section.type === "experience" ? 35 : 28;
    if (y + estimatedHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      if (type === "resume" && name && email) {
        y = addEnterpriseResumeHeader(doc, name, email, margin, pageWidth);
        y += sectionSpacing;
      }
    }

    if (section.type === "heading") {
      // Main section heading with professional accent bar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      
      const headingText = stripMarkdown(section.content.trim());
      
      // Add accent bar before heading
      doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.rect(margin, y - 0.5, 4, 6, "F");
      
      doc.text(headingText, margin + 7, y + 3);
      y += lineHeight + 4;
      
      // Add subtle divider line
      doc.setLineWidth(0.3);
      doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    } else if (section.type === "paragraph") {
      const text = stripMarkdown(section.content);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + paragraphSpacing;
    } else if (section.type === "list") {
      section.items!.forEach((item) => {
        // Check for new page before each item
        if (y + lineHeight + 3 > pageHeight - margin - 12) {
          doc.addPage();
          y = margin;
          if (type === "resume" && name && email) {
            y = addEnterpriseResumeHeader(doc, name, email, margin, pageWidth);
            y += sectionSpacing;
          }
        }
        
        const itemText = stripMarkdown(item.trim());
        const itemLines = doc.splitTextToSize(itemText, maxWidth - 10);
        
        // Professional bullet point with accent color
        doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
        doc.circle(margin + 3, y - 1.5, 1.3, "F");
        
        // Text with proper indentation
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(itemLines, margin + 8, y);
        y += itemLines.length * lineHeight + 2;
      });
      y += paragraphSpacing;
    } else if (section.type === "experience") {
      // Handle experience entries with better formatting
      y = addExperienceEntry(doc, section, margin, maxWidth, y, pageHeight, margin, type === "resume" && name && email ? { name, email } : undefined);
    }
  }

  // Add page numbers
  addPageNumbers(doc, pageHeight, pageWidth);

  // Generate PDF buffer
  return Buffer.from(doc.output("arraybuffer"));
}

interface ParsedSection {
  type: "heading" | "paragraph" | "list" | "experience";
  content: string;
  items?: string[];
  level?: number;
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/`(.+?)`/g, "$1") // Code
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Links
    .trim();
}

function parseMarkdownContent(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let currentList: string[] = [];
  let currentParagraph: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";

    // Handle headings
    if (line.startsWith("#")) {
      // Flush current content
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      const level = (line.match(/^#+/) || [""])[0].length;
      const headingText = line.replace(/^#+\s*/, "").trim();
      sections.push({ type: "heading", content: headingText, level });
      i++;
    }
    // Handle list items (bullet points)
    else if (line.match(/^[-*•]\s/) || /^\d+\.\s/.test(line)) {
      // Flush current paragraph
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      const itemText = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim();
      if (itemText.length > 0) {
        currentList.push(itemText);
      }
      i++;
    }
    // Handle experience entries (bold job title followed by company and dates)
    else if (line.includes("**") && (line.includes("|") || line.match(/\d{2}\/\d{4}/))) {
      // Flush current content
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      // Parse experience entry
      const experienceResult = parseExperienceEntry(lines, i);
      if (experienceResult) {
        sections.push(experienceResult.entry);
        i = experienceResult.endIndex;
      } else {
        currentParagraph.push(line);
        i++;
      }
    }
    // Handle empty lines
    else if (line.length === 0) {
      // Flush current content
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      if (currentParagraph.length > 0) {
        sections.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }
      i++;
    }
    // Handle regular text
    else {
      // Flush current list
      if (currentList.length > 0) {
        sections.push({ type: "list", items: [...currentList], content: "" });
        currentList = [];
      }
      currentParagraph.push(line);
      i++;
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

/**
 * Parse experience entry (job title, company, dates, bullets)
 */
function parseExperienceEntry(lines: string[], startIndex: number): { entry: ParsedSection; endIndex: number } | null {
  if (startIndex >= lines.length) return null;

  const titleLine = lines[startIndex].trim();
  const titleMatch = titleLine.match(/\*\*(.+?)\*\*/);
  if (!titleMatch) return null;

  const jobTitle = titleMatch[1];
  const restOfLine = titleLine.replace(/\*\*(.+?)\*\*/, "").trim();
  
  // Extract company, location, dates
  const parts = restOfLine.split("|").map(p => p.trim());
  let company = "";
  let location = "";
  let dates = "";

  if (parts.length >= 2) {
    company = parts[0];
    if (parts.length >= 3) {
      location = parts[1];
      dates = parts.slice(2).join(" | ");
    } else {
      dates = parts[1];
    }
  } else {
    // Try to extract dates from the line
    const dateMatch = restOfLine.match(/(\d{2}\/\d{4}\s*-\s*\d{2}\/\d{4}|\d{2}\/\d{4}\s*-\s*Present)/);
    if (dateMatch) {
      dates = dateMatch[1];
      company = restOfLine.replace(dateMatch[0], "").trim();
    } else {
      company = restOfLine;
    }
  }

  // Collect bullet points
  const bullets: string[] = [];
  let i = startIndex + 1;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.match(/^[-*•]\s/)) {
      const bullet = line.replace(/^[-*•]\s*/, "").trim();
      if (bullet.length > 0) {
        bullets.push(bullet);
      }
      i++;
    } else if (line.length === 0 || line.startsWith("#")) {
      break;
    } else {
      i++;
    }
  }

  return {
    entry: {
      type: "experience",
      content: `${jobTitle}|${company}|${location}|${dates}`,
      items: bullets,
      level: 0,
    },
    endIndex: i,
  };
}

/**
 * Add experience entry with enterprise-grade formatting
 */
function addExperienceEntry(
  doc: jsPDF,
  section: ParsedSection,
  margin: number,
  maxWidth: number,
  y: number,
  pageHeight: number,
  pageMargin: number,
  header?: { name: string; email: string }
): number {
  const parts = section.content.split("|");
  const jobTitle = parts[0] || "";
  const company = parts[1] || "";
  const location = parts[2] || "";
  const dates = parts[3] || "";

  // Job title - Bold, larger, primary color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  const titleLines = doc.splitTextToSize(jobTitle, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 2;

  // Company, location, dates - Regular, smaller, light gray
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);
  
  const details: string[] = [];
  if (company) details.push(company);
  if (location) details.push(location);
  if (dates) details.push(dates);
  
  if (details.length > 0) {
    const detailsText = details.join(" | ");
    const detailsLines = doc.splitTextToSize(detailsText, maxWidth);
    doc.text(detailsLines, margin, y);
    y += detailsLines.length * 5.5 + 4;
  }

  // Bullet points
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  
  if (section.items && section.items.length > 0) {
    section.items.forEach((bullet) => {
      // Check for new page
      if (y + 7 > pageHeight - pageMargin - 12) {
        doc.addPage();
        y = pageMargin;
        if (header) {
          y = addEnterpriseResumeHeader(doc, header.name, header.email, margin, doc.internal.pageSize.getWidth());
          y += 10;
        }
      }

      const bulletText = stripMarkdown(bullet);
      const bulletLines = doc.splitTextToSize(bulletText, maxWidth - 10);
      
      // Professional bullet point with accent color
      doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.circle(margin + 3, y - 1.5, 1.3, "F");
      
      // Text
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(bulletLines, margin + 8, y);
      y += bulletLines.length * 6 + 2;
    });
  }

  y += 5; // Space after experience entry
  return y;
}

function addEnterpriseResumeHeader(
  doc: jsPDF,
  name: string,
  email: string,
  margin: number,
  pageWidth: number
): number {
  let y = margin;

  // Name - Large, bold, centered, primary color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  const nameWidth = doc.getTextWidth(name);
  doc.text(name, (pageWidth - nameWidth) / 2, y);
  y += 11;

  // Contact info - Smaller, centered, secondary color
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  
  const emailWidth = doc.getTextWidth(email);
  doc.text(email, (pageWidth - emailWidth) / 2, y);
  y += 8;

  // Add professional divider line with accent bar
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
  doc.line(margin, y, pageWidth - margin, y);
  
  // Add accent bar
  doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.rect(margin, y - 0.5, 25, 1, "F");
  
  y += 8;

  return y;
}

/**
 * Add page numbers
 */
function addPageNumbers(doc: jsPDF, pageHeight: number, pageWidth: number): void {
  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightText[0], COLORS.lightText[1], COLORS.lightText[2]);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }
}
