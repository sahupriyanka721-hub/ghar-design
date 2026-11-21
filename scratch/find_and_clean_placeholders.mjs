import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const srcDir = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src';
const files = walk(srcDir);
console.log(`Scanning ${files.length} files...`);

let modifiedFiles = 0;
let totalReplacements = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Remove all placeholder="e.g. ..." or placeholder='e.g. ...'
  content = content.replace(/placeholder=["']e\.g\.[^"']*["']/g, (match) => {
    totalReplacements++;
    return 'placeholder=""';
  });

  // 2. Remove any placeholders containing fake names or phones like Vikram, Ramesh, Rajesh, Pooja, Mahavir, 98765, 9811
  content = content.replace(/placeholder=["'][^"']*(Vikram|Ramesh|Rajesh|Pooja|Mahavir|Priya|987654|981122)[^"']*["']/gi, (match) => {
    totalReplacements++;
    return 'placeholder=""';
  });

  // 3. Remove 1-click test buttons from InteriorDesignerLandingPage and VendorLandingPage
  if (file.includes('InteriorDesignerLandingPage.tsx') || file.includes('VendorLandingPage.tsx')) {
    content = content.replace(/\{\/\* 1-Click Fast Test Fixtures \*\/\}[\s\S]*?\{\/\* Metric/g, '{/* Metric');
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log(`Cleaned: ${path.relative(srcDir, file)}`);
  }
}

console.log(`\nFinished! Modified ${modifiedFiles} files with ${totalReplacements} placeholder/dummy replacements.`);
