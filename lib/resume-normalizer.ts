/**
 * Resume Normalizer
 * Converts raw parsed resume text into a clean, structured format
 */

export interface NormalizedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  professional_summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
  projects: Project[];
  raw_text: string;
}

interface Experience {
  company: string;
  title: string;
  duration: string;
  start_date: string;
  end_date: string;
  description: string[];
  location?: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
  gpa?: string;
  details?: string[];
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
}

/**
 * Extract candidate name from resume text
 */
function extractName(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  
  if (lines.length === 0) return '';
  
  // Look for first line that's not a header/metadata
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Skip if it looks like a header, metadata, or URL
    if (line.match(/^(resume|cv|curriculum|vitae|contact|email|phone|location|http|www)/i)) {
      continue;
    }
    
    // If line contains name-like patterns (2-4 words, mostly letters)
    const nameCandidate = line
      .split(/\s+/)
      .filter(word => word.match(/^[A-Z][a-z]+$/))
      .join(' ');
    
    if (nameCandidate.length > 2 && nameCandidate.length < 100) {
      return nameCandidate;
    }
    
    // Also check if it's just the first meaningful line
    if (line.length > 2 && line.length < 100 && line.match(/[a-z]/i)) {
      const parts = line.split(/\s+/);
      if (parts.length <= 5) { // Likely a name, not a description
        return line;
      }
    }
  }
  
  return '';
}

/**
 * Extract contact information with better handling for inline formats
 */
function extractContact(text: string): { email: string; phone: string; location: string } {
  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch?.[1] || '';
  
  // Phone - handle various formats
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,13})/);
  let phone = '';
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
  }
  
  // Location - look for city, country or state patterns
  const locationMatch = text.match(/(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,?\s*(?:[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))?)/);
  const location = locationMatch?.[1] || '';
  
  return { email, phone, location };
}

/**
 * Extract professional summary with better section detection
 */
function extractProfessionalSummary(text: string): string {
  const lines = text.split('\n');
  
  // Find summary section - more flexible matching
  const summaryIdx = lines.findIndex(l => 
    l.match(/^(PROFESSIONAL\s+)?SUMMARY$|^OVERVIEW$|^PROFILE$|^OBJECTIVE$/i)
  );
  
  if (summaryIdx < 0) return '';
  
  // Get text until next section
  const summary: string[] = [];
  for (let i = summaryIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop at next major section header
    if (line.match(/^(EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS?|COURSEWORK|TECHNICAL|AWARDS|LANGUAGES|REFERENCES)$/i)) {
      break;
    }
    
    // Skip empty lines at start
    if (line.length > 0 || summary.length > 0) {
      summary.push(line);
    }
  }
  
  return summary
    .filter(l => l.length > 0)
    .join(' ')
    .trim();
}

/**
 * Extract experience with better date and format parsing
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  const lines = text.split('\n');
  
  // Find experience section
  const expIdx = lines.findIndex(l => 
    l.match(/^(PROFESSIONAL\s+)?EXPERIENCE$|^WORK\s+EXPERIENCE$|^EMPLOYMENT$/i)
  );
  
  if (expIdx < 0) return experiences;
  
  let i = expIdx + 1;
  let currentExp: Partial<Experience> | null = null;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at next major section
    if (line.match(/^(EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS?|COURSEWORK|TECHNICAL|AWARDS|LANGUAGES|REFERENCES)$/i)) {
      if (currentExp) {
        experiences.push({
          company: currentExp.company || '',
          title: currentExp.title || '',
          duration: currentExp.duration || '',
          start_date: currentExp.start_date || '',
          end_date: currentExp.end_date || '',
          description: currentExp.description || [],
          location: currentExp.location,
        });
      }
      break;
    }
    
    if (line.length === 0) {
      i++;
      continue;
    }
    
    // Job title pattern: "Title\nCompany Month Year - Month Year"
    // Or "Title Company Month Year - Month Year"
    const jobTitleMatch = line.match(/^([A-Z][a-zA-Z\s]+?)(?:\s+|$)/);
    
    // Check if next line has company name and dates
    const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
    const datePattern = /([A-Z][a-z]+\s+\d{4}|Present|Current)\s*[-–]\s*([A-Z][a-z]+\s+\d{4}|Present|Current)/i;
    
    // If this line looks like a job title and next line has dates
    if (jobTitleMatch && (datePattern.test(nextLine) || datePattern.test(line))) {
      // Save previous experience
      if (currentExp) {
        experiences.push({
          company: currentExp.company || '',
          title: currentExp.title || '',
          duration: currentExp.duration || '',
          start_date: currentExp.start_date || '',
          end_date: currentExp.end_date || '',
          description: currentExp.description || [],
          location: currentExp.location,
        });
      }
      
      // Parse new job
      currentExp = {
        title: jobTitleMatch[1].trim(),
        company: '',
        duration: '',
        start_date: '',
        end_date: '',
        description: [],
      };
      
      // Check if company and dates are on same line
      const companyDateMatch = line.match(/^([A-Z][a-zA-Z\s]+?)\s+([A-Z][a-z]+\s+\d{4}|Present|Current)\s*[-–]\s*([A-Z][a-z]+\s+\d{4}|Present|Current)/i);
      if (companyDateMatch) {
        currentExp.company = companyDateMatch[1].trim();
        currentExp.start_date = companyDateMatch[2].trim();
        currentExp.end_date = companyDateMatch[3].trim();
        currentExp.duration = `${companyDateMatch[2]} - ${companyDateMatch[3]}`;
      } else if (datePattern.test(nextLine)) {
        currentExp.company = nextLine.split(datePattern)[0].trim();
        const dates = nextLine.match(datePattern);
        if (dates) {
          currentExp.start_date = dates[1].trim();
          currentExp.end_date = dates[2].trim();
          currentExp.duration = `${dates[1]} - ${dates[2]}`;
        }
        i++; // Skip next line since we processed it
      }
    }
    // Bullet point descriptions
    else if (line.match(/^[-•*]|^\d+\./) && currentExp) {
      currentExp.description = currentExp.description || [];
      currentExp.description.push(line.replace(/^[-•*\d.]\s*/, '').trim());
    }
    // Company name on separate line after title
    else if (currentExp && currentExp.title && !currentExp.company && line.match(/^[A-Z]/) && !line.match(/^[-•*]/)) {
      const parts = line.split(/\s+/);
      
      // Check if this line has dates
      const dateMatch = line.match(/([A-Z][a-z]+\s+\d{4}|Present|Current)\s*[-–]\s*([A-Z][a-z]+\s+\d{4}|Present|Current)/i);
      if (dateMatch) {
        // Extract company (everything before first date)
        const beforeDate = line.substring(0, line.indexOf(dateMatch[0])).trim();
        currentExp.company = beforeDate;
        currentExp.start_date = dateMatch[1].trim();
        currentExp.end_date = dateMatch[2].trim();
        currentExp.duration = `${dateMatch[1]} - ${dateMatch[2]}`;
      } else {
        currentExp.company = line;
      }
    }
    
    i++;
  }
  
  // Add last experience
  if (currentExp) {
    experiences.push({
      company: currentExp.company || '',
      title: currentExp.title || '',
      duration: currentExp.duration || '',
      start_date: currentExp.start_date || '',
      end_date: currentExp.end_date || '',
      description: currentExp.description || [],
      location: currentExp.location,
    });
  }
  
  return experiences.filter(e => e.title.length > 0 || e.company.length > 0);
}

/**
 * Extract education section
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  const lines = text.split('\n');
  
  const eduIdx = lines.findIndex(l => l.match(/^(EDUCATION|COURSEWORK|ACADEMIC|UNIVERSITY|COLLEGE|SCHOOL)$/i));
  if (eduIdx < 0) return education;
  
  let i = eduIdx + 1;
  let currentEdu: Partial<Education> = {};
  let educationItems: Partial<Education>[] = [];
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at next section
    if (line.match(/^(SKILLS|EXPERIENCE|CERTIFICATIONS|PROJECTS|TECHNICAL|AWARDS|LANGUAGES|REFERENCES)$/i)) break;
    
    if (line.length === 0) {
      if (Object.keys(currentEdu).length > 0) {
        educationItems.push(currentEdu);
        currentEdu = {};
      }
      i++;
      continue;
    }
    
    // University/institution name or degree line
    if (line.match(/(?:University|College|Institute|School|Institute|Academy)/i) || 
        line.match(/^(Bachelor|Master|PHD|BS|BA|MS|MA|MBA|Associate|Diploma)/i)) {
      
      // This could be institution or degree
      if (line.match(/(?:University|College|Institute|School)/i)) {
        currentEdu.institution = line;
      } else if (line.match(/^(Bachelor|Master|PHD|BS|BA|MS|MA|MBA|Associate|Diploma)/i)) {
        // Parse degree and field
        const degreeMatch = line.match(/(Bachelor|Master|PHD|BS|BA|MS|MA|MBA|Associate|Diploma)[^,\n]*/i);
        const fieldMatch = line.match(/(?:in|of)\s+([^,\n]+)/i);
        
        if (degreeMatch) currentEdu.degree = degreeMatch[0].trim();
        if (fieldMatch) currentEdu.field = fieldMatch[1].trim();
      }
    }
    // Graduation date
    else if (line.match(/\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
      const yearMatch = line.match(/\d{4}/);
      if (yearMatch) currentEdu.graduation_date = yearMatch[0];
    }
    // GPA
    else if (line.match(/gpa|grade point/i)) {
      const gpaMatch = line.match(/\d\.\d+/);
      if (gpaMatch) currentEdu.gpa = gpaMatch[0];
    }
    // Additional details
    else if (line.length > 5 && !line.match(/^[-•*]/)) {
      if (!currentEdu.details) currentEdu.details = [];
      currentEdu.details.push(line);
    }
    
    i++;
  }
  
  // Add last education
  if (Object.keys(currentEdu).length > 0) {
    educationItems.push(currentEdu);
  }
  
  // Convert to proper Education objects
  return educationItems.map(e => ({
    institution: e.institution || '',
    degree: e.degree || '',
    field: e.field || '',
    graduation_date: e.graduation_date || '',
    gpa: e.gpa,
    details: e.details,
  })).filter(e => e.institution || e.degree);
}

/**
 * Extract skills section with better delimited parsing
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split('\n');
  
  const skillsIdx = lines.findIndex(l => l.match(/^SKILLS$/i) || l.match(/^TECHNICAL\s+(?:SKILLS|DEVELOPMENT)/i));
  
  if (skillsIdx < 0) return skills;
  
  for (let i = skillsIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop at next section
    if (line.match(/^(EXPERIENCE|EDUCATION|CERTIFICATIONS|PROJECTS|COURSEWORK|AWARDS|REFERENCES)$/i)) break;
    
    if (line.length === 0) continue;
    
    // Skip category headers like "- Programming:", "- Web Technologies:"
    if (line.match(/^[-•]?\s*[A-Z][a-z\s&/]+:\s*$/)) continue;
    
    // Remove category prefix if present (e.g., "Programming: " or "- Programming: ")
    let skillLine = line.replace(/^[-•]?\s*[A-Z][a-z\s&/]+:\s*/, '').trim();
    
    // If line ends with colon, it's a category header, skip
    if (skillLine.match(/:$/)) continue;
    
    // Split by various delimiters: comma, semicolon, hyphen (when used as delimiter), pipe
    const skillList = skillLine
      .split(/[,;|]/)
      .flatMap(s => s.split(/(?:^|\s)-(?:\s|$)/)) // Split on standalone hyphens
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^[-•*]/));
    
    skills.push(...skillList);
  }
  
  // Remove duplicates and filter out empty entries
  return [...new Set(skills)].filter(s => s.length > 0);
}

/**
 * Extract certifications
 */
function extractCertifications(text: string): string[] {
  const certifications: string[] = [];
  const lines = text.split('\n');
  
  const certIdx = lines.findIndex(l => l.match(/^(certifications?|licenses?|awards?|credentials?)/i));
  
  if (certIdx >= 0) {
    for (let i = certIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^(experience|education|skills|projects|references)/i)) break;
      
      if (line.length > 0 && !line.match(/^(certifications?|licenses?)/i)) {
        certifications.push(line.replace(/^[-•*]\s*/, ''));
      }
    }
  }
  
  return certifications;
}

/**
 * Extract projects
 */
function extractProjects(text: string): Project[] {
  const projects: Project[] = [];
  const lines = text.split('\n');
  
  const projIdx = lines.findIndex(l => l.match(/^(projects?|portfolio|notable\s+work)/i));
  
  if (projIdx >= 0) {
    let i = projIdx + 1;
    let currentProject: Partial<Project> = {};
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line.match(/^(experience|education|skills|certifications)/i)) break;
      
      if (line.length === 0) {
        i++;
        continue;
      }
      
      // Project title (usually bold or standalone)
      if (line.match(/^[A-Z][a-zA-Z\s]+(?::|$)/) && !line.match(/^[-•*]/)) {
        if (Object.keys(currentProject).length > 0) {
          projects.push({
            name: currentProject.name || '',
            description: currentProject.description || '',
            technologies: currentProject.technologies || [],
          });
        }
        
        currentProject = {
          name: line.replace(/:$/, ''),
          description: '',
          technologies: [],
        };
      }
      // Technologies
      else if (line.match(/(?:tech|tools|stack|technologies?):/i)) {
        const techMatch = line.replace(/(?:tech|tools|stack|technologies?):\s*/i, '');
        currentProject.technologies = techMatch.split(/[,;]/).map(t => t.trim());
      }
      // Description
      else if (line.length > 5) {
        currentProject.description = (currentProject.description || '') + ' ' + line;
      }
      
      i++;
    }
    
    if (Object.keys(currentProject).length > 0) {
      projects.push({
        name: currentProject.name || '',
        description: currentProject.description?.trim() || '',
        technologies: currentProject.technologies || [],
      });
    }
  }
  
  return projects;
}

/**
 * Normalize raw resume text into structured format
 */
export async function normalizeResume(rawText: string): Promise<NormalizedResume> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Resume text is empty');
  }
  
  // Clean up text
  let cleanedText = rawText
    .replace(/[^\w\s@.,;:\-\/\(\)]/g, '') // Remove special characters
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Extract all sections
  const name = extractName(cleanedText);
  const { email, phone, location } = extractContact(cleanedText);
  const professional_summary = extractProfessionalSummary(cleanedText);
  const experience = extractExperience(cleanedText);
  const education = extractEducation(cleanedText);
  const skills = extractSkills(cleanedText);
  const certifications = extractCertifications(cleanedText);
  const projects = extractProjects(cleanedText);
  
  return {
    name,
    email,
    phone,
    location,
    professional_summary,
    experience,
    education,
    skills,
    certifications,
    projects,
    raw_text: rawText,
  };
}

/**
 * Format normalized resume as clean markdown
 */
export function formatNormalizedResume(resume: NormalizedResume): string {
  let output = '';
  
  // Header with contact info
  if (resume.name) output += `# ${resume.name}\n\n`;
  
  const contact: string[] = [];
  if (resume.email) contact.push(resume.email);
  if (resume.phone) contact.push(resume.phone);
  if (resume.location) contact.push(resume.location);
  
  if (contact.length > 0) {
    output += `${contact.join(' | ')}\n\n`;
  }
  
  // Professional Summary
  if (resume.professional_summary) {
    output += `## Professional Summary\n${resume.professional_summary}\n\n`;
  }
  
  // Experience
  if (resume.experience.length > 0) {
    output += `## Professional Experience\n\n`;
    for (const exp of resume.experience) {
      output += `**${exp.title}** | ${exp.company}\n`;
      if (exp.start_date || exp.end_date) {
        output += `${exp.start_date} - ${exp.end_date}\n`;
      }
      if (exp.location) output += `${exp.location}\n`;
      
      if (exp.description.length > 0) {
        for (const desc of exp.description) {
          output += `- ${desc}\n`;
        }
      }
      output += '\n';
    }
  }
  
  // Education
  if (resume.education.length > 0) {
    output += `## Education\n\n`;
    for (const edu of resume.education) {
      output += `**${edu.degree}${edu.field ? ' in ' + edu.field : ''}** | ${edu.institution}\n`;
      if (edu.graduation_date) output += `Graduated: ${edu.graduation_date}\n`;
      if (edu.gpa) output += `GPA: ${edu.gpa}\n`;
      if (edu.details?.length) {
        for (const detail of edu.details) {
          output += `- ${detail}\n`;
        }
      }
      output += '\n';
    }
  }
  
  // Skills
  if (resume.skills.length > 0) {
    output += `## Skills\n${resume.skills.join(', ')}\n\n`;
  }
  
  // Certifications
  if (resume.certifications.length > 0) {
    output += `## Certifications\n`;
    for (const cert of resume.certifications) {
      output += `- ${cert}\n`;
    }
    output += '\n';
  }
  
  // Projects
  if (resume.projects.length > 0) {
    output += `## Projects\n\n`;
    for (const project of resume.projects) {
      output += `**${project.name}**\n${project.description}\n`;
      if (project.technologies.length > 0) {
        output += `**Technologies:** ${project.technologies.join(', ')}\n`;
      }
      output += '\n';
    }
  }
  
  return output.trim();
}
