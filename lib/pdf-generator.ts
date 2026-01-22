import { jsPDF } from "jspdf";
import { removeAllPlaceholders } from "./placeholder-detector";
import { getTheme, ResumeTheme } from "./themes";

export interface PDFOptions {
  type: "resume" | "coverLetter";
  content: string;
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  company?: string;
  jobTitle?: string;
  themeId?: string; // NEW: Accept theme ID
}

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
 * Strips markdown bold/italic formatting from text
 * Converts **bold** and *italic* to plain text
 */
function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // ***bold italic*** -> text
    .replace(/\*\*(.+?)\*\*/g, '$1')       // **bold** -> text
    .replace(/\*(?!\s)(.+?)(?<!\s)\*/g, '$1')  // *italic* -> text (not bullet)
    .replace(/__(.+?)__/g, '$1')           // __underline__ -> text
    .replace(/_(.+?)_/g, '$1')             // _italic_ -> text
    .replace(/\*\*/g, '')                  // Stray ** markers
    .trim();
}

/**
 * Generates an ENTERPRISE-GRADE, premium-quality PDF from markdown content.
 * Optimized for ATS compatibility and human readability with professional design.
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email, themeId } = options;
  const cleanedContent = removeAllPlaceholders(stripCodeBlocks(content));

  // Initialize Theme
  const theme = getTheme(themeId);
  const COLORS = theme.colors;
  const FONTS = theme.fonts;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // PROFESSIONAL LAYOUT CONSTANTS
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const MARGIN = 20; // ~0.8 inch Standard Professional Margin
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
  const BOTTOM_THRESHOLD = PAGE_HEIGHT - MARGIN;

  let cursorY = MARGIN;

  // Typographic Scale
  const SIZE_NAME = 22;
  const SIZE_H1 = 14;
  const SIZE_H2 = 12;
  const SIZE_BODY = 10.5;
  const LINE_HEIGHT_BODY = theme.layout.lineHeight;

  // Helper: Check Page Break and Add Page if Needed
  const checkPageBreak = (heightNeeded: number) => {
    if (cursorY + heightNeeded > BOTTOM_THRESHOLD) {
      doc.addPage();
      cursorY = MARGIN;
      // Re-add Header (Name Only) on subsequent pages?
      // Optional: For now, we prefer clean pages.
    }
  };

  // Helper: Render Text Block with Wrapping
  const renderTextParagraph = (text: string, fontSize: number, fontName: string, fontStyle: string, color: number[], spacingAfter: number = 2) => {
    doc.setFont(fontName, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    checkPageBreak(lines.length * LINE_HEIGHT_BODY + spacingAfter);

    lines.forEach((line: string) => {
      doc.text(line, MARGIN, cursorY);
      cursorY += LINE_HEIGHT_BODY;
    });

    cursorY += spacingAfter;
  };

  // Helper: Render Bullet Point
  const renderBullet = (text: string) => {
    doc.setFont(FONTS.body, "normal");
    doc.setFontSize(SIZE_BODY);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

    const bulletIndent = 5;
    const textWidth = CONTENT_WIDTH - bulletIndent;
    const lines = doc.splitTextToSize(text, textWidth);

    checkPageBreak(lines.length * LINE_HEIGHT_BODY + 2);

    // Draw Bullet
    doc.setFillColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]); // Dynamic bullet color
    doc.circle(MARGIN + 2, cursorY - 1.5, 0.8, "F");

    lines.forEach((line: string) => {
      doc.text(line, MARGIN + bulletIndent, cursorY);
      cursorY += LINE_HEIGHT_BODY;
    });

    cursorY += 1.5; // Slight spacing between bullets
  };

  // 1. RENDER HEADER (Name & Contact) - ALWAYS RENDER with fallbacks
  const displayName = name || "Professional Resume";
  const displayEmail = options.email || "";
  const displayPhone = options.phone || "";
  const displayLinkedin = options.linkedin || "";
  const displayLocation = options.location || "";

  checkPageBreak(40);

  // Name (Centered)
  doc.setFont(FONTS.header, "bold");
  doc.setFontSize(SIZE_NAME);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  const nameWidth = doc.getTextWidth(displayName);
  doc.text(displayName, (PAGE_WIDTH - nameWidth) / 2, cursorY);
  cursorY += 10;

  // Build contact info line with all available fields
  const contactParts: string[] = [];
  if (displayEmail) contactParts.push(displayEmail);
  if (displayPhone) contactParts.push(displayPhone);
  if (displayLocation) contactParts.push(displayLocation);

  // Contact Line 1 (Email | Phone | Location)
  if (contactParts.length > 0) {
    doc.setFont(FONTS.header, "normal");
    doc.setFontSize(SIZE_BODY);
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    const contactLine = contactParts.join("  |  ");
    const contactWidth = doc.getTextWidth(contactLine);
    doc.text(contactLine, (PAGE_WIDTH - contactWidth) / 2, cursorY);
    cursorY += 5;
  }

  // Contact Line 2 (LinkedIn) - separate line for clean layout
  if (displayLinkedin) {
    doc.setFont(FONTS.header, "normal");
    doc.setFontSize(SIZE_BODY - 1);
    doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    // Clean LinkedIn URL for display
    const linkedinDisplay = displayLinkedin.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const linkedinWidth = doc.getTextWidth(linkedinDisplay);
    doc.text(linkedinDisplay, (PAGE_WIDTH - linkedinWidth) / 2, cursorY);
    cursorY += 5;
  }

  // Divider Line
  cursorY += 3;
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
  doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
  cursorY += 10;

  // COVER LETTER: ADD RECIPIENT BLOCK & DATE
  if (type === "coverLetter") {
    // ... (Implement cover letter specific layout if needed, using same fonts) ...
  }

  // 2. PARSE AND RENDER CONTENT
  const lines = cleanedContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // DUPLICATION GUARD: If line matches name or is "Professional Summary" header when we just started
    // Actually, AI sometimes outputs "# Name". We detect that.
    if (i < 5 && name && line.toLowerCase().includes(name.toLowerCase())) {
      i++; // Skip name if generated in markdown
      continue;
    }
    // Also skip if it is just contact info (contains email)
    if (i < 5 && email && line.toLowerCase().includes(email.toLowerCase())) {
      i++;
      continue;
    }

    // SECTION HEADER (e.g., # Professional Experience)
    if (line.startsWith("# ")) {
      const headerText = line.replace(/^#\s+/, "").toUpperCase(); // Force Uppercase for Professional Look
      checkPageBreak(25);

      if (cursorY > MARGIN + 20) cursorY += 5; // Extra space before new section

      doc.setFont(FONTS.header, "bold");
      doc.setFontSize(SIZE_H1);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(headerText, MARGIN, cursorY);
      cursorY += 7;

      // Section Underline (Thicker)
      doc.setLineWidth(0.7);
      doc.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
      cursorY += 8;

      i++;
      continue;
    }

    // SUB-HEADER / JOB TITLE (e.g., ### Senior Engineer)
    // Supports both `### Title` and `## Title`
    if (line.startsWith("##") || line.startsWith("###")) {
      const subHeaderText = line.replace(/^#+\s+/, "");
      checkPageBreak(20);

      if (cursorY > MARGIN) cursorY += 4;

      doc.setFont(FONTS.header, "bold");
      doc.setFontSize(SIZE_H2);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(subHeaderText, MARGIN, cursorY);
      cursorY += 6;
      i++;
      continue;
    }

    // METADATA LINE (Company | Date | Location)
    // STRICTER CHECK: Must contain "|" or be a known pattern, not just ANY bold text
    // We want to avoid catching "**Team Lead**" as metadata if it's actually a sub-header.
    const isMetadata = (
      (line.includes("|") && /\d{4}|Present|Current/i.test(line)) || // Standard metadata line
      (line.startsWith("**") && line.includes("|")) // Bold metadata with pipe
    );

    if (isMetadata) {
      const metaText = line.replace(/\*\*/g, "").trim(); // Strip bold markers for clean text
      checkPageBreak(10);

      doc.setFont(FONTS.header, "normal"); // Sans-serif for metadata looks cleaner
      doc.setFontSize(SIZE_BODY - 0.5);
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]); // Dark Grey
      doc.text(metaText, MARGIN, cursorY);
      cursorY += 6;
      i++;
      continue;
    }

    // BOLD "HEADERS" that aren't Markdown Headers (fallback)
    // If a line is just "**Text**" and short, treat it as a small sub-header
    if (line.startsWith("**") && line.endsWith("**") && line.length < 50) {
      const boldText = line.replace(/\*\*/g, "").trim();
      checkPageBreak(15);
      if (cursorY > MARGIN) cursorY += 3;

      doc.setFont(FONTS.header, "bold");
      doc.setFontSize(SIZE_BODY); // Same as body but bold
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(boldText, MARGIN, cursorY);
      cursorY += 6;
      i++;
      continue;
    }

    // BULLET POINTS
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      const bulletText = stripMarkdownFormatting(line.replace(/^[-*•]\s+/, ""));
      renderBullet(bulletText);
      i++;
      continue;
    }

    // REGULAR PARAGRAPH
    const cleanedLine = stripMarkdownFormatting(line);
    renderTextParagraph(cleanedLine, SIZE_BODY, FONTS.body, "normal", COLORS.text);
    i++;
  }

  // ADD PAGE NUMBERS
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
