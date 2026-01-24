import { jsPDF } from "jspdf";
import { removeAllPlaceholders } from "./placeholder-detector";
import { getTheme } from "./themes";

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
  themeId?: string;
  watermark?: string;
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
 */
function stripMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(?!\s)(.+?)(?<!\s)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\*\*/g, '')
    .trim();
}

/**
 * Generates an ENTERPRISE-GRADE, premium-quality PDF from markdown content.
 * Optimized for ATS compatibility and human readability with simple, robust logic.
 */
export async function generateProfessionalPDF(options: PDFOptions): Promise<Buffer> {
  const { type, content, name, email, themeId } = options;
  const cleanedContent = removeAllPlaceholders(stripCodeBlocks(content));

  // Initialize Theme
  const theme = getTheme(themeId);
  const COLORS = theme.colors;
  const FONTS = theme.fonts;
  const LAYOUT = theme.layout;
  const TYPO = theme.typography;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  // Dynamic Layout Constants
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_MARGIN = LAYOUT.margin;
  const CONTENT_WIDTH = PAGE_WIDTH - (2 * PAGE_MARGIN);
  const BOTTOM_THRESHOLD = PAGE_HEIGHT - PAGE_MARGIN;

  let cursorY = PAGE_MARGIN;

  // Helper: Check Page Break
  const checkPageBreak = (heightNeeded: number) => {
    if (cursorY + heightNeeded > BOTTOM_THRESHOLD) {
      doc.addPage();
      cursorY = PAGE_MARGIN;
    }
  };

  // Helper: Render Text Paragraph
  const renderTextParagraph = (text: string, fontSize: number, fontName: string, fontStyle: string, color: number[], spacingAfter: number = 2) => {
    doc.setFont(fontName, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    checkPageBreak(lines.length * (fontSize * 0.35) + spacingAfter); // Approx height logic

    lines.forEach((line: string) => {
      doc.text(line, PAGE_MARGIN, cursorY);
      cursorY += (fontSize * 0.35 * LAYOUT.lineHeight); // Dynamic line height
    });

    cursorY += spacingAfter;
  };

  // Helper: Render Bullet
  const renderBullet = (text: string) => {
    doc.setFont(FONTS.body, "normal");
    doc.setFontSize(TYPO.size.body);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

    const bulletIndent = 5;
    const textWidth = CONTENT_WIDTH - bulletIndent;
    const lines = doc.splitTextToSize(text, textWidth);
    const lineHeight = TYPO.size.body * 0.35 * LAYOUT.lineHeight;

    checkPageBreak(lines.length * lineHeight + LAYOUT.itemSpacing);

    // Draw Bullet
    doc.setFillColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.circle(PAGE_MARGIN + 2, cursorY - (lineHeight / 3), 0.7, "F");

    lines.forEach((line: string) => {
      doc.text(line, PAGE_MARGIN + bulletIndent, cursorY);
      cursorY += lineHeight;
    });

    cursorY += (LAYOUT.itemSpacing / 2);
  };

  // 1. RENDER HEADER
  const displayName = name || "Professional Resume";
  const displayEmail = options.email || "";
  const displayPhone = options.phone || "";
  const displayLinkedin = options.linkedin || "";
  const displayLocation = options.location || "";

  const contactParts: string[] = [];
  if (displayEmail) contactParts.push(displayEmail);
  if (displayPhone) contactParts.push(displayPhone);
  if (displayLocation) contactParts.push(displayLocation);
  if (displayLinkedin) contactParts.push(displayLinkedin.replace(/^https?:\/\//, '').replace(/\/$/, ''));

  // HEADER STRATEGY: BANNER
  if (LAYOUT.headerStyle === "banner") {
    const bannerHeight = 50;
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, PAGE_WIDTH, bannerHeight, "F");

    cursorY = 20;

    // Name (White)
    doc.setFont(FONTS.header, TYPO.weight.header);
    doc.setFontSize(TYPO.size.name);
    doc.setTextColor(255, 255, 255);
    const nameWidth = doc.getTextWidth(displayName);
    doc.text(displayName, (PAGE_WIDTH - nameWidth) / 2, cursorY);
    cursorY += 10;

    // Contact (White/Grey)
    if (contactParts.length > 0) {
      doc.setFont(FONTS.header, "normal");
      doc.setFontSize(TYPO.size.body);
      doc.setTextColor(230, 230, 230);
      const contactLine = contactParts.join("  |  ");
      const contactWidth = doc.getTextWidth(contactLine);
      doc.text(contactLine, (PAGE_WIDTH - contactWidth) / 2, cursorY);
    }
    cursorY = bannerHeight + LAYOUT.headerBottomMargin;

  } else if (LAYOUT.headerStyle === "left-border") {
    // HEADER STRATEGY: LEFT BORDER
    // Thick Left Border
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(2);
    doc.line(PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN + 35);

    const indent = 6;
    cursorY = PAGE_MARGIN + 5;

    // Name
    doc.setFont(FONTS.header, TYPO.weight.header);
    doc.setFontSize(TYPO.size.name);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(displayName, PAGE_MARGIN + indent, cursorY);
    cursorY += 10;

    // Contact (Stacked)
    doc.setFont(FONTS.header, "normal");
    doc.setFontSize(TYPO.size.body);
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);

    contactParts.forEach(part => {
      doc.text(part, PAGE_MARGIN + indent, cursorY);
      cursorY += 5;
    });

    cursorY += LAYOUT.headerBottomMargin;

  } else {
    // HEADER STRATEGY: CLEAN / TRADITIONAL / CENTERED
    const isCentered = LAYOUT.headerStyle === "centered";
    const alignX = isCentered ? (PAGE_WIDTH / 2) : PAGE_MARGIN;
    const alignOpt = isCentered ? { align: "center" } as any : undefined;

    // Name
    doc.setFont(FONTS.header, TYPO.weight.header);
    doc.setFontSize(TYPO.size.name);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(displayName, alignX, cursorY, alignOpt);
    cursorY += 8;

    // Contact
    if (contactParts.length > 0) {
      doc.setFont(FONTS.header, "normal");
      doc.setFontSize(TYPO.size.body);
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      const contactLine = contactParts.join("  |  ");
      doc.text(contactLine, alignX, cursorY, alignOpt);
      cursorY += 8;
    }

    // Divider
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.line(PAGE_MARGIN, cursorY, PAGE_WIDTH - PAGE_MARGIN, cursorY);
    cursorY += LAYOUT.headerBottomMargin;
  }

  // 2. PARSE BODY CONTENT
  const lines = cleanedContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) { i++; continue; }

    // Skip Name/Email if found in markdown (duplicate guard)
    if (i < 5 && name && line.toLowerCase().includes(name.toLowerCase())) { i++; continue; }
    if (i < 5 && email && line.toLowerCase().includes(email.toLowerCase())) { i++; continue; }

    // SECTION HEADER (# Experience)
    if (line.startsWith("# ")) {
      const headerText = line.replace(/^#\s+/, "").toUpperCase();
      checkPageBreak(25);

      if (cursorY > PAGE_MARGIN + 20) cursorY += LAYOUT.sectionSpacing;

      doc.setFont(FONTS.header, "bold");
      doc.setFontSize(TYPO.size.title);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(headerText, PAGE_MARGIN, cursorY);
      cursorY += 2;

      // Underline
      doc.setLineWidth(0.7);
      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.line(PAGE_MARGIN, cursorY + 2, PAGE_WIDTH - PAGE_MARGIN, cursorY + 2);
      cursorY += 8;

      i++; continue;
    }

    // SUB-HEADER (## Job Title)
    if (line.startsWith("##") || line.startsWith("###")) {
      const subText = line.replace(/^#+\s+/, "");
      checkPageBreak(20);
      if (cursorY > PAGE_MARGIN) cursorY += LAYOUT.itemSpacing;

      doc.setFont(FONTS.header, "bold");
      doc.setFontSize(TYPO.size.subtitle);
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.text(subText, PAGE_MARGIN, cursorY);
      cursorY += 6;
      i++; continue;
    }

    // METADATA (Date | Location)
    // Detect pipe + date/present/current
    if ((line.includes("|") && /\d{4}|Present|Current/i.test(line)) || (line.startsWith("**") && line.includes("|"))) {
      const metaText = line.replace(/\*\*/g, "").trim();
      checkPageBreak(10);

      doc.setFont(FONTS.header, "normal");
      doc.setFontSize(TYPO.size.small);
      doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.text(metaText, PAGE_MARGIN, cursorY);
      cursorY += 5;
      i++; continue;
    }

    // BOLD TEXT (Fallback Sub-header)
    if (line.startsWith("**") && line.endsWith("**") && line.length < 50) {
      const boldText = line.replace(/\*\*/g, "").trim();
      checkPageBreak(15);
      if (cursorY > PAGE_MARGIN) cursorY += 2;

      doc.setFont(FONTS.body, "bold");
      doc.setFontSize(TYPO.size.body);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(boldText, PAGE_MARGIN, cursorY);
      cursorY += 6;
      i++; continue;
    }

    // BULLETS
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
      const bulletText = stripMarkdownFormatting(line.replace(/^[-*•]\s+/, ""));
      renderBullet(bulletText);
      i++; continue;
    }

    // REGULAR TEXT
    renderTextParagraph(stripMarkdownFormatting(line), TYPO.size.body, FONTS.body, "normal", COLORS.text);
    i++;
  }

  // ADD PAGE NUMBERS & WATERMARK
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });

    if (options.watermark) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(60);
      doc.setTextColor(200, 200, 200);
      doc.text(options.watermark.toUpperCase(), PAGE_WIDTH / 2, PAGE_HEIGHT / 2, {
        align: "center",
        angle: 45,
        renderingMode: "fill"
      });
      doc.restoreGraphicsState();
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
