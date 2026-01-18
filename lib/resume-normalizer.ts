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
  
  // First line is usually the name
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    
    // Skip if it looks like a header or metadata
    if (!firstLine.match(/^(resume|cv|curriculum|vitae|contact|email|phone)/i)) {
      // Clean up common prefixes
      let name = firstLine.replace(/^(mr|ms|mrs|dr|prof)\.\s*/i, '').trim();
      
      // If it's reasonably short and looks like a name, return it
      if (name.length > 2 && name.length < 100 && name.match(/[a-z]/i)) {
        return name;
      }
    }
  }
  
  return '';
}

/**
 * Extract contact information (email, phone, location)
 */
function extractContact(text: string): { email: string; phone: string; location: string } {
  const email = text.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || '';
  
  // Phone patterns (US and international)
  const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
  const phone = phoneMatch ? `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}` : '';
  
  // Location - look for city, state patterns
  const locationMatch = text.match(/((?:[A-Z][a-z]+,?\s*)?[A-Z]{2})|([A-Z][a-z]+,?\s*[A-Z][a-z]+)/);
  const location = locationMatch?.[0] || '';
  
  return { email, phone, location };
}

/**
 * Extract professional summary
 */
function extractProfessionalSummary(text: string): string {
  const lines = text.split('\n');
  
  // Look for summary section
  const summaryIdx = lines.findIndex(l => l.match(/^(professional\s+summary|summary|objective|profile|about)/i));
  
  if (summaryIdx >= 0) {
    // Get next few lines until we hit a section header
    const summary: string[] = [];
    for (let i = summaryIdx + 1; i < lines.length && i < summaryIdx + 6; i++) {
      const line = lines[i].trim();
      if (line.match(/^(experience|education|skills|certifications|projects)/i)) break;
      if (line.length > 0) {
        summary.push(line);
      }
    }
    return summary.join(' ').trim();
  }
  
  return '';
}

/**
 * Extract experience section
 */
function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];
  const lines = text.split('\n');
  
  // Find experience section
  const expIdx = lines.findIndex(l => l.match(/^(professional\s+experience|work\s+experience|experience|employment)/i));
  
  if (expIdx < 0) return experiences;
  
  let i = expIdx + 1;
  let currentExp: Partial<Experience> = {};
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at next major section
    if (line.match(/^(education|skills|certifications|projects|references)/i)) break;
    
    if (line.length === 0) {
      i++;
      continue;
    }
    
    // Look for job title and company (usually bold or on same line)
    if (line.match(/[A-Z][a-z]+.*(?:at|@|\||-|,).*[A-Z]/)) {
      // Save previous experience if exists
      if (Object.keys(currentExp).length > 0) {
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
      const parts = line.split(/(?:at|@|\||-|,)/);
      currentExp = {
        title: parts[0]?.trim() || '',
        company: parts[1]?.trim() || '',
        duration: '',
        start_date: '',
        end_date: '',
        description: [],
      };
    }
    // Look for dates
    else if (line.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
      currentExp.duration = line;
      // Try to parse start and end dates
      const dateMatch = line.match(/(\w+\s+\d{4})[^0-9]*(?:[\-–]|to)?[^0-9]*(\w+\s+\d{4})?/i);
      if (dateMatch) {
        currentExp.start_date = dateMatch[1];
        currentExp.end_date = dateMatch[2] || 'Present';
      }
    }
    // Bullet points are descriptions
    else if (line.match(/^[-•*]/) || line.match(/^\d+\./)) {
      if (!currentExp.description) currentExp.description = [];
      currentExp.description.push(line.replace(/^[-•*\d.]\s*/, '').trim());
    }
    
    i++;
  }
  
  // Add last experience
  if (Object.keys(currentExp).length > 0) {
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
  
  return experiences;
}

/**
 * Extract education section
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  const lines = text.split('\n');
  
  const eduIdx = lines.findIndex(l => l.match(/^(education|academic|university|college|school)/i));
  if (eduIdx < 0) return education;
  
  let i = eduIdx + 1;
  let currentEdu: Partial<Education> = {};
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at next section
    if (line.match(/^(skills|experience|certifications|projects|references)/i)) break;
    
    if (line.length === 0) {
      i++;
      continue;
    }
    
    // University/institution name (usually capitalized)
    if (line.match(/[A-Z].*(?:University|College|Institute|School)/i)) {
      if (Object.keys(currentEdu).length > 0) {
        education.push({
          institution: currentEdu.institution || '',
          degree: currentEdu.degree || '',
          field: currentEdu.field || '',
          graduation_date: currentEdu.graduation_date || '',
          gpa: currentEdu.gpa,
          details: currentEdu.details,
        });
      }
      
      currentEdu = {
        institution: line,
        degree: '',
        field: '',
        graduation_date: '',
      };
    }
    // Degree and major
    else if (line.match(/(?:bachelor|master|phd|bs|ba|ms|ma|mba|associate|diploma)/i)) {
      const degreeMatch = line.match(/(bachelor|master|phd|bs|ba|ms|ma|mba|associate|diploma)[^,]*/i);
      const majorMatch = line.match(/(?:in|of)\s+([^,\n]+)/i);
      
      if (degreeMatch) currentEdu.degree = degreeMatch[0].trim();
      if (majorMatch) currentEdu.field = majorMatch[1].trim();
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
    else if (line.length > 5) {
      if (!currentEdu.details) currentEdu.details = [];
      currentEdu.details.push(line);
    }
    
    i++;
  }
  
  if (Object.keys(currentEdu).length > 0) {
    education.push({
      institution: currentEdu.institution || '',
      degree: currentEdu.degree || '',
      field: currentEdu.field || '',
      graduation_date: currentEdu.graduation_date || '',
      gpa: currentEdu.gpa,
      details: currentEdu.details,
    });
  }
  
  return education;
}

/**
 * Extract skills section
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split('\n');
  
  const skillsIdx = lines.findIndex(l => l.match(/^(skills|technical\s+skills|competencies|expertise)/i));
  
  if (skillsIdx >= 0) {
    for (let i = skillsIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop at next section
      if (line.match(/^(experience|education|certifications|projects|references)/i)) break;
      
      if (line.length === 0) continue;
      
      // Split by common delimiters
      const skillList = line.split(/[,;•\-|]/).map(s => s.trim()).filter(s => s.length > 0);
      skills.push(...skillList);
    }
  }
  
  return [...new Set(skills)]; // Remove duplicates
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
