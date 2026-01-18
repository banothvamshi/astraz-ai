/**
 * Test Resume Normalization
 * Run with: npx ts-node test-normalizer.ts
 */

import { normalizeResume, formatNormalizedResume } from "./lib/resume-normalizer";

const sampleResume = `Vamshi Banoth
India banothvamshi13@gmail.com +91 6302061843 in/vamshi-banoth

SUMMARY
Versatile and results-driven technology and creative professional with comprehensive expertise in Data Science, Full-Stack Software Development,
Content Creation, and Digital Media. Proficient in full-stack development, data analytics, video production, digital content creation, and quality
assurance. Demonstrated success in delivering high-impact projects using cutting-edge tools and technologies, including AI platforms such as
ChatGPT, Claude, Gemini, and Veo 3. Adept at managing online communities (e.g., Discord), supporting gamers and QA teams, and ensuring on-time
project delivery through effective production coordination and team communication. Skilled in utilizing industry-standard creative suites,
productivity tools, and technical frameworks. Strong understanding of agile methodologies, project tracking, and cross-functional collaboration.
Recognized for exceptional attention to detail, problem-solving ability, and consistent performance in fast-paced, deadline-driven environments.
Open to roles in software development, data science, technical support, community management, QA coordination, digital media, and project
operations.

EXPERIENCE

Technical Lead
Highbrow Technology Inc January 2025 - Present
Managed a 200-member Discord server, ensuring smooth community engagement, timely support for gamers and QA testers, and resolution of
technical or coordination issues.
• Oversaw ongoing production workflows, maintained timelines, and ensured consistent progress by facilitating communication between team
members and support roles.

Video Annotator
Highbrow Technology Inc November 2024 - January 2025
Analyzed and annotated video data with high accuracy to ensure precise labeling for machine learning models, meeting project deadlines
consistently.
• Collaborated with cross-functional teams to improve annotation guidelines and workflows, resulting in enhanced data quality and efficiency.

Technical Trainer
Freelancing August 2024 - November 2024
Conducted technical training sessions for 200+ students, delivering comprehensive curriculum tailored to diverse skill levels, resulting in
improved understanding and application of key concepts.
• Designed and facilitated interactive workshops on emerging technologies, ensuring student engagement and achieving high satisfaction ratings
from participants.

EDUCATION

Full Stack Developer
NxtWave

Data Analyst and Data Science
NxtWave

SKILLS

Technical Development:
- Programming: Python, JavaScript, C++
- Web Technologies: HTML5, CSS3, Bootstrap, React.js, Node.js, RESTful APIs
- Databases: MySQL, PostgreSQL, MongoDB, SQLite

Data & Analytics:
- ML/AI: TensorFlow, PyTorch, Scikit-learn, Keras
- Data Processing: Pandas, NumPy, SciPy, PySpark

Content Creation & Media:
- Video Editing: Adobe Premiere Pro, After Effects, DaVinci Resolve
- Graphics: Photoshop, Illustrator, Canva, Figma

CERTIFICATIONS

Programming Foundations with Python
Build Your Own Dynamic Web Application
Introduction to Databases
Data Science 101
`;

async function test() {
  console.log("Testing Resume Normalization...\n");
  
  try {
    const normalized = await normalizeResume(sampleResume);
    
    console.log("✅ Successfully normalized resume!\n");
    console.log("EXTRACTED DATA:");
    console.log("===============\n");
    
    console.log(`Name: ${normalized.name}`);
    console.log(`Email: ${normalized.email}`);
    console.log(`Phone: ${normalized.phone}`);
    console.log(`Location: ${normalized.location}\n`);
    
    console.log(`Summary (first 150 chars):\n${normalized.professional_summary.substring(0, 150)}...\n`);
    
    console.log(`Experience Entries: ${normalized.experience.length}`);
    normalized.experience.forEach((exp, i) => {
      console.log(`  ${i + 1}. ${exp.title} at ${exp.company} (${exp.duration})`);
    });
    
    console.log(`\nEducation Entries: ${normalized.education.length}`);
    normalized.education.forEach((edu, i) => {
      console.log(`  ${i + 1}. ${edu.degree} - ${edu.institution}`);
    });
    
    console.log(`\nSkills Extracted: ${normalized.skills.length}`);
    console.log(`  Top 15: ${normalized.skills.slice(0, 15).join(", ")}`);
    
    console.log(`\nCertifications: ${normalized.certifications.length}`);
    normalized.certifications.slice(0, 3).forEach((cert, i) => {
      console.log(`  ${i + 1}. ${cert}`);
    });
    
    console.log("\n\nFORMATTED RESUME OUTPUT:");
    console.log("========================\n");
    const formatted = formatNormalizedResume(normalized);
    console.log(formatted);
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

test();
