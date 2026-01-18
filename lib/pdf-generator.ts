import { jsPDF } from "jspdf";

export interface PDFOptions {
  type: "resume" | "coverLetter";
  content: string;
  name?: string;
  email?: string;
}

/**
 * Strips markdown code blocks from content
 */
function stripCodeBlocks(content: string): string {
  // Remove markdown code blocks (```markdown ... ``` or ``` ... ```)
  let cleaned = content
    .replace(/^```markdown\s*\n?/gm, "")
    .replace(/^```\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();
  
  // Also handle inline code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  
  return cleaned;
}

/**
 * Generates a PREMIUM, professional-quality PDF from markdown content.
 * Optimized for ATS compatibility and human readability.
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email } = options;

  // Strip code blocks and clean content
  const cleanedContent = stripCodeBlocks(content);

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
  const lineHeight = 5.5;
  const paragraphSpacing = 3;
  const sectionSpacing = 10;

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

  const parsedSections = parseMarkdownContent(cleanedContent);

  for (const section of parsedSections) {
    // Check for new page
    const estimatedHeight = section.type === "heading" ? 20 : section.type === "list" ? section.items!.length * (lineHeight + 1) + 10 : 25;
    if (y + estimatedHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      if (type === "resume" && name && email) {
        y = addPremiumResumeHeader(doc, name, email, margin, pageWidth);
        y += sectionSpacing;
      }
    }

    if (section.type === "heading") {
      // Main section heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      const headingText = stripMarkdown(section.content.trim());
      doc.text(headingText, margin, y);
      y += lineHeight + 2;
      
      // Add subtle underline for main sections
      doc.setLineWidth(0.3);
      doc.setDrawColor(180, 180, 180);
      doc.line(margin, y - 1, pageWidth - margin, y - 1);
      y += 4;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
    } else if (section.type === "paragraph") {
      const text = stripMarkdown(section.content);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight + paragraphSpacing;
    } else if (section.type === "list") {
      section.items!.forEach((item) => {
        // Check for new page before each item
        if (y + lineHeight + 2 > pageHeight - margin - 10) {
          doc.addPage();
          y = margin;
          if (type === "resume" && name && email) {
            y = addPremiumResumeHeader(doc, name, email, margin, pageWidth);
            y += sectionSpacing;
          }
        }
        
        const itemText = stripMarkdown(item.trim());
        const itemLines = doc.splitTextToSize(itemText, maxWidth - 8);
        
        // Bullet point
        doc.setFillColor(60, 60, 60);
        doc.circle(margin + 2, y - 1.5, 1, "F");
        
        // Text with proper indentation
        doc.text(itemLines, margin + 6, y);
        y += itemLines.length * lineHeight + 1;
      });
      y += paragraphSpacing;
    } else if (section.type === "experience") {
      // Handle experience entries with better formatting
      y = addExperienceEntry(doc, section, margin, maxWidth, y, pageHeight, margin, type === "resume" && name && email ? { name, email } : undefined);
    }
  }

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
 * Add experience entry with professional formatting
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

  // Job title - Bold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const titleLines = doc.splitTextToSize(jobTitle, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 1;

  // Company, location, dates - Regular, smaller
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  const details: string[] = [];
  if (company) details.push(company);
  if (location) details.push(location);
  if (dates) details.push(dates);
  
  if (details.length > 0) {
    const detailsText = details.join(" | ");
    const detailsLines = doc.splitTextToSize(detailsText, maxWidth);
    doc.text(detailsLines, margin, y);
    y += detailsLines.length * 5 + 2;
  }

  // Bullet points
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  
  if (section.items && section.items.length > 0) {
    section.items.forEach((bullet) => {
      // Check for new page
      if (y + 6 > pageHeight - pageMargin - 10) {
        doc.addPage();
        y = pageMargin;
        if (header) {
          y = addPremiumResumeHeader(doc, header.name, header.email, margin, doc.internal.pageSize.getWidth());
          y += 10;
        }
      }

      const bulletText = stripMarkdown(bullet);
      const bulletLines = doc.splitTextToSize(bulletText, maxWidth - 8);
      
      // Bullet point
      doc.setFillColor(60, 60, 60);
      doc.circle(margin + 2, y - 1.5, 1, "F");
      
      // Text
      doc.text(bulletLines, margin + 6, y);
      y += bulletLines.length * 5.5 + 1;
    });
  }

  y += 3; // Space after experience entry
  return y;
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
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  const nameWidth = doc.getTextWidth(name);
  doc.text(name, (pageWidth - nameWidth) / 2, y);
  y += 9;

  // Contact info - Smaller, centered
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const emailWidth = doc.getTextWidth(email);
  doc.text(email, (pageWidth - emailWidth) / 2, y);
  y += 6;

  // Add subtle divider line
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  return y;
}
