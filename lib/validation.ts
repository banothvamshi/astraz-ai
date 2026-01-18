/**
 * Comprehensive input validation and sanitization
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate PDF file
 */
export function validatePDF(buffer: Buffer): ValidationResult {
  // Check buffer exists
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "PDF file is empty" };
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`,
    };
  }

  // Check minimum size (PDF header is at least 4 bytes)
  if (buffer.length < 4) {
    return { valid: false, error: "File is too small to be a valid PDF" };
  }

  // Validate PDF header
  const header = buffer.slice(0, 4).toString();
  if (!header.startsWith("%PDF")) {
    return { valid: false, error: "Invalid file format. Please upload a PDF file." };
  }

  // Check PDF version (should be 1.0-1.9 or 2.0)
  const versionMatch = buffer.toString("utf8", 0, 1024).match(/%PDF-(\d\.\d)/);
  if (versionMatch) {
    const version = parseFloat(versionMatch[1]);
    if (version < 1.0 || version > 2.0) {
      return { valid: false, error: `Unsupported PDF version: ${versionMatch[1]}` };
    }
  }

  return { valid: true };
}

/**
 * Validate job description
 */
export function validateJobDescription(jobDescription: string): ValidationResult {
  if (!jobDescription || typeof jobDescription !== "string") {
    return { valid: false, error: "Job description is required" };
  }

  const trimmed = jobDescription.trim();

  // Minimum length
  if (trimmed.length < 50) {
    return {
      valid: false,
      error: `Job description is too short (${trimmed.length} characters). Please provide at least 50 characters.`,
    };
  }

  // Maximum length (prevent abuse)
  const maxLength = 50000; // 50k characters
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Job description is too long (${trimmed.length} characters). Maximum is ${maxLength} characters.`,
    };
  }

  // Check for suspicious content (potential injection attempts)
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /<iframe/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: "Job description contains invalid content" };
    }
  }

  // Check if it's mostly whitespace
  const nonWhitespace = trimmed.replace(/\s/g, "").length;
  if (nonWhitespace < 30) {
    return {
      valid: false,
      error: "Job description contains too little actual content",
    };
  }

  return { valid: true };
}

/**
 * Sanitize job description
 */
export function sanitizeJobDescription(jobDescription: string): string {
  return jobDescription
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize whitespace
    .replace(/[ \t]+/g, " ")
    // Normalize line breaks
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive newlines
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * Validate base64 string
 */
export function validateBase64(base64: string): ValidationResult {
  if (!base64 || typeof base64 !== "string") {
    return { valid: false, error: "Invalid base64 data" };
  }

  // Remove data URL prefix if present
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;

  // Check length
  if (cleanBase64.length === 0) {
    return { valid: false, error: "Base64 data is empty" };
  }

  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleanBase64)) {
    return { valid: false, error: "Invalid base64 format" };
  }

  return { valid: true };
}

/**
 * Validate file name
 */
export function validateFileName(fileName: string): ValidationResult {
  if (!fileName || typeof fileName !== "string") {
    return { valid: false, error: "Invalid file name" };
  }

  // Check length
  if (fileName.length > 255) {
    return { valid: false, error: "File name is too long" };
  }

  // Check for path traversal attempts
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { valid: false, error: "Invalid file name" };
  }

  // Check for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1F]/;
  if (dangerousChars.test(fileName)) {
    return { valid: false, error: "File name contains invalid characters" };
  }

  return { valid: true };
}
