// Test pure JS PDF generator
import fs from 'fs';

function generatePdf(title, lines) {
  let content = `BT\n/F1 18 Tf\n50 780 Td\n(${title}) Tj\nET\n`;
  content += `BT\n/F2 10 Tf\n50 750 Td\n`;
  let y = 750;
  for (const line of lines) {
    // Escape parens and backslashes
    const safe = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    content += `(${safe}) Tj\nT*\n`;
  }
  content += `ET\n`;

  const streamLength = Buffer.byteLength(content, 'utf8');

  const objects = [
    `%PDF-1.4\n`,
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\n`
  ];

  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  let offset = objects[0].length;
  for (let i = 1; i < objects.length; i++) {
    xref += String(offset).padStart(10, '0') + ` 00000 n \n`;
    offset += objects[i].length;
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  return objects.join('') + xref + trailer;
}

const pdf = generatePdf('BUILDGHAR OFFICIAL QUOTATION', [
  'Quotation Code: BG/QUO/REQ/0008',
  'Customer Name: Sharika Mishra',
  'Total Amount: Rs. 4,50,000',
  'Status: PUBLISHED_TO_CUSTOMER'
]);

fs.writeFileSync('scratch/test.pdf', pdf, 'utf8');
console.log('PDF written successfully, size:', pdf.length);
