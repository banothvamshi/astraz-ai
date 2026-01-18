const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test_resume.pdf'));

doc.fontSize(25).text('John Doe', 100, 100);
doc.fontSize(12).text('Software Engineer', 100, 150);
doc.text('Experience: 5 years in Node.js and React.', 100, 180);

doc.end();
console.log('PDF created successfully');
