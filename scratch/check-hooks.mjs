import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, filelist);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      filelist.push(p);
    }
  }
  return filelist;
}

const files = walk('apps/web/src');
let totalViolations = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let currentComponent = null;
  let earlyReturnSeen = false;
  let componentBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect component definition
    const compMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_]*)/);
    if (compMatch && (line.includes('React.FC') || line.includes('=>') || line.includes('function'))) {
      currentComponent = compMatch[1];
      earlyReturnSeen = false;
      componentBraceDepth = 0;
    }

    if (currentComponent) {
      // Check for early return (return <Something /> or return null or return <Navigate />)
      if (line.match(/^\s*if\s*\(.*?\)\s*return\s+/) || (line.includes('return ') && (line.includes('<') || line.includes('null;')) && !line.includes('return (') && !line.includes('return <div className="min-h-screen'))) {
        // check if this is an early return inside component body
        if (i < lines.length - 20) {
          earlyReturnSeen = true;
        }
      }

      // Check if hook is called after early return
      if (earlyReturnSeen) {
        const hookMatch = line.match(/\b(useRef|useState|useEffect|useMemo|useCallback)\b/);
        if (hookMatch) {
          console.log(`🚨 HOOK VIOLATION in ${file}:${i + 1} (${currentComponent}): ${line.trim()}`);
          totalViolations++;
        }
      }
    }
  }
}

console.log(`\nScan complete. Total potential violations: ${totalViolations}`);
