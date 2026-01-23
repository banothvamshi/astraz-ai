/**
 * Advanced PDF Generator with Professional Styling
 * Beautiful layout with proper colors, fonts, spacing, alignment
 */

import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface ResumeData {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string | string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  skills?: string[];
  certifications?: string[];
}

export async function generateResumePDF(
  data: ResumeData,
  coverLetter?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ============================================
      // COLOR SCHEME & STYLING
      // ============================================
      // ============================================
      // COLOR SCHEME & STYLING (2026 NEO-MODERN)
      // ============================================
      const colors = {
        primary: "#0f172a",    // Slate 900 (Deep, Executive)
        secondary: "#4f46e5",  // Indigo 600 (Modern Tech/Creative)
        accent: "#0ea5e9",     // Sky 500 (Subtle Highlight)
        text: "#334155",       // Slate 700 (High Readability)
        lightText: "#64748b",  // Slate 500 (Meta info)
        background: "#ffffff", // Pure White (Cleanest)
        divider: "#e2e8f0"     // Slate 200 (Very subtle)
      };

      const fonts = {
        heading: "Helvetica-Bold",
        subheading: "Helvetica-Bold", // Modernist approach usually uses same family with weight diff
        body: "Helvetica",
        mono: "Courier",
      };

      // ============================================
      // HEADER SECTION
      // ============================================
      // ============================================
      // HEADER SECTION (Minimalist Centered)
      // ============================================
      doc.fontSize(24); // Slightly smaller, more elegant
      doc.font(fonts.heading);
      doc.fillColor(colors.primary);
      doc.text((data.name || "Your Name").toUpperCase(), {
        align: "center",
        characterSpacing: 1, // Modern tracking
      });

      doc.moveDown(0.3);

      // Contact info line
      doc.fontSize(9);
      doc.font(fonts.body);
      doc.fillColor(colors.lightText);

      const contactInfo = [
        data.email,
        data.phone,
        data.location,
        data.links && data.links.length > 0 ? data.links[0] : "linkedin.com/in/profile",
      ]
        .filter(Boolean)
        .join("  •  "); // Wide spacing for airiness

      doc.text(contactInfo, {
        align: "center",
        link: data.email ? `mailto:${data.email}` : undefined,
      });

      doc.moveDown(1.5); // More whitespace

      // Subtle Divider (Partial width)
      const dividerWidth = 100;
      const centerX = doc.page.width / 2;
      doc.lineWidth(1);
      doc.strokeColor(colors.divider);
      doc.moveTo(centerX - dividerWidth, doc.y)
        .lineTo(centerX + dividerWidth, doc.y)
        .stroke();

      doc.moveDown(1.5);

      // ============================================
      // PROFESSIONAL SUMMARY
      // ============================================
      if (data.summary && data.summary.trim()) {
        doc.fontSize(12);
        doc.font(fonts.subheading);
        doc.fillColor(colors.primary);
        doc.text("PROFESSIONAL SUMMARY", { underline: false });

        doc.fontSize(10);
        doc.font(fonts.body);
        doc.fillColor(colors.text);
        doc.text(data.summary, {
          align: "left",
          lineGap: 4,
        });

        doc.moveDown(0.6);
      }

      // ============================================
      // EXPERIENCE SECTION
      // ============================================
      if (data.experience && data.experience.length > 0) {
        doc.fontSize(12);
        doc.font(fonts.subheading);
        doc.fillColor(colors.primary);
        doc.text("PROFESSIONAL EXPERIENCE", { underline: false });

        doc.moveDown(0.3);

        data.experience.forEach((exp, idx) => {
          // Job title and company on same line
          doc.fontSize(11);
          doc.font(fonts.subheading);
          doc.fillColor(colors.secondary);
          doc.text(`${exp.title} at ${exp.company}`, { lineGap: 2 });

          // Duration
          doc.fontSize(9);
          doc.font(fonts.body);
          doc.fillColor(colors.lightText);
          doc.text(exp.duration, { lineGap: 2 });

          // Description
          doc.fontSize(10);
          doc.font(fonts.body);
          doc.fillColor(colors.text);

          // Handle description as string or string array
          const descriptionText = Array.isArray(exp.description)
            ? exp.description.join("\n")
            : exp.description;

          // Format description as bullet points
          const bullets = descriptionText
            .split("\n")
            .filter((b) => b.trim());
          bullets.forEach((bullet) => {
            const cleanBullet = bullet
              .replace(/^[•\-\*]\s*/, "")
              .trim();
            if (cleanBullet) {
              doc.text(`• ${cleanBullet}`, {
                indent: 15,
                lineGap: 2,
                width: doc.page.width - 100,
              });
            }
          });

          if (idx < (data.experience?.length || 0) - 1) {
            doc.moveDown(0.4);
          }
        });

        doc.moveDown(0.6);
      }

      // ============================================
      // EDUCATION SECTION
      // ============================================
      if (data.education && data.education.length > 0) {
        doc.fontSize(12);
        doc.font(fonts.subheading);
        doc.fillColor(colors.primary);
        doc.text("EDUCATION", { underline: false });

        doc.moveDown(0.3);

        data.education.forEach((edu) => {
          doc.fontSize(11);
          doc.font(fonts.subheading);
          doc.fillColor(colors.secondary);
          doc.text(edu.degree, { lineGap: 2 });

          doc.fontSize(10);
          doc.font(fonts.body);
          doc.fillColor(colors.text);
          doc.text(edu.institution, { lineGap: 2 });

          doc.fontSize(9);
          doc.font(fonts.body);
          doc.fillColor(colors.lightText);
          doc.text(edu.year);

          if (edu.details) {
            doc.fontSize(9);
            doc.fillColor(colors.text);
            doc.text(edu.details);
          }

          doc.moveDown(0.3);
        });

        doc.moveDown(0.4);
      }

      // ============================================
      // SKILLS SECTION
      // ============================================
      if (data.skills && data.skills.length > 0) {
        doc.fontSize(12);
        doc.font(fonts.subheading);
        doc.fillColor(colors.primary);
        doc.text("SKILLS", { underline: false });

        doc.moveDown(0.3);

        // Group skills into categories (if possible)
        const skillsText = data.skills.join(" • ");

        doc.fontSize(10);
        doc.font(fonts.body);
        doc.fillColor(colors.text);
        doc.text(skillsText, {
          align: "left",
          lineGap: 3,
          width: doc.page.width - 100,
        });

        doc.moveDown(0.6);
      }

      // ============================================
      // CERTIFICATIONS SECTION
      // ============================================
      if (data.certifications && data.certifications.length > 0) {
        doc.fontSize(12);
        doc.font(fonts.subheading);
        doc.fillColor(colors.primary);
        doc.text("CERTIFICATIONS", { underline: false });

        doc.moveDown(0.3);

        data.certifications.forEach((cert) => {
          doc.fontSize(10);
          doc.font(fonts.body);
          doc.fillColor(colors.text);
          doc.text(`• ${cert}`, {
            indent: 10,
            lineGap: 2,
          });
        });

        doc.moveDown(0.6);
      }

      // ============================================
      // COVER LETTER (if provided - on new page)
      // ============================================
      if (coverLetter && coverLetter.trim()) {
        doc.addPage();

        // Header on cover letter page
        doc.fontSize(11);
        doc.font(fonts.body);
        doc.fillColor(colors.text);
        doc.text(data.name || "Your Name");
        if (data.email) doc.text(data.email);
        if (data.phone) doc.text(data.phone);
        if (data.location) doc.text(data.location);

        doc.moveDown(1);

        // Date
        doc.text(new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }));

        doc.moveDown(1);

        // Salutation
        doc.text("Dear Hiring Manager,");
        doc.moveDown(0.5);

        // Cover letter body
        doc.fontSize(10);
        doc.font(fonts.body);
        doc.fillColor(colors.text);
        doc.text(coverLetter, {
          align: "left",
          lineGap: 4,
          width: doc.page.width - 80,
        });

        doc.moveDown(1);

        // Closing
        doc.text("Sincerely,");
        doc.moveDown(2);
        doc.text(data.name || "Your Name");
      }

      // ============================================
      // FOOTER WITH PAGE NUMBERS
      // ============================================
      const pages = doc.bufferedPageRange().count;
      for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8);
        doc.font(fonts.body);
        doc.fillColor(colors.lightText);
        doc.text(
          `Page ${i + 1} of ${pages}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom + 15,
          { align: "center" }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateATSResumePDF(
  data: ResumeData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ============================================
      // ATS-OPTIMIZED (plain, no special formatting)
      // ============================================

      doc.fontSize(14);
      doc.font("Helvetica-Bold");
      doc.fillColor("#000000");
      doc.text((data.name || "Your Name").toUpperCase());

      doc.fontSize(10);
      doc.font("Helvetica");
      const contactInfo = [data.email, data.phone, data.location]
        .filter(Boolean)
        .join(" | ");
      doc.text(contactInfo);

      doc.moveDown(0.8);

      // Professional Summary
      if (data.summary && data.summary.trim()) {
        doc.fontSize(11);
        doc.font("Helvetica-Bold");
        doc.text("PROFESSIONAL SUMMARY");
        doc.fontSize(10);
        doc.font("Helvetica");
        doc.text(data.summary);
        doc.moveDown(0.6);
      }

      // Experience
      if (data.experience && data.experience.length > 0) {
        doc.fontSize(11);
        doc.font("Helvetica-Bold");
        doc.text("PROFESSIONAL EXPERIENCE");
        doc.moveDown(0.3);

        data.experience.forEach((exp) => {
          doc.fontSize(10);
          doc.font("Helvetica-Bold");
          doc.text(`${exp.title} - ${exp.company}`);
          doc.fontSize(9);
          doc.font("Helvetica");
          doc.text(exp.duration);

          // Handle description as string or string array
          const descriptionText = Array.isArray(exp.description)
            ? exp.description.join("\n")
            : exp.description;
          doc.text(descriptionText);
          doc.moveDown(0.4);
        });
      }

      // Education
      if (data.education && data.education.length > 0) {
        doc.fontSize(11);
        doc.font("Helvetica-Bold");
        doc.text("EDUCATION");
        doc.moveDown(0.3);

        data.education.forEach((edu) => {
          doc.fontSize(10);
          doc.font("Helvetica-Bold");
          doc.text(edu.degree);
          doc.fontSize(9);
          doc.font("Helvetica");
          doc.text(edu.institution);
          doc.text(edu.year);
          doc.moveDown(0.3);
        });
      }

      // Skills
      if (data.skills && data.skills.length > 0) {
        doc.fontSize(11);
        doc.font("Helvetica-Bold");
        doc.text("SKILLS");
        doc.moveDown(0.3);

        doc.fontSize(10);
        doc.font("Helvetica");
        doc.text(data.skills.join(", "));
        doc.moveDown(0.6);
      }

      // Certifications
      if (data.certifications && data.certifications.length > 0) {
        doc.fontSize(11);
        doc.font("Helvetica-Bold");
        doc.text("CERTIFICATIONS");
        doc.moveDown(0.3);

        doc.fontSize(10);
        doc.font("Helvetica");
        data.certifications.forEach((cert) => {
          doc.text(`• ${cert}`);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
