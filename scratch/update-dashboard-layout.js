const fs = require('fs');
const file = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design/apps/web/src/components/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize CRLF to LF first
const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

// 1. Add Briefcase to imports
if (!content.includes('Briefcase,')) {
  content = content.replace('  Sparkles,', '  Sparkles,\n  Briefcase,');
}

// 2. Add quick switcher to profile dropdown
const targetDropdown = `<div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();`;

const replaceDropdown = `<div className="border-t border-slate-100 my-1" />
                <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Switch Desk
                </div>
                <Link
                  to="/professional"
                  className="flex items-center gap-2.5 px-4 py-2 text-sky-700 hover:bg-sky-50 font-bold"
                >
                  <Briefcase className="w-4 h-4 text-sky-600" />
                  <span>Architect Workspace</span>
                </Link>
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-4 py-2 text-purple-700 hover:bg-purple-50 font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Desk</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();`;

if (content.includes(targetDropdown)) {
  content = content.replace(targetDropdown, replaceDropdown);
  console.log('Dropdown updated successfully!');
} else {
  console.log('targetDropdown not found');
}

// 3. Add top navbar quick link
const targetBell = `<div className="h-6 w-px bg-slate-200" />`;
const replaceBell = `<Link
            to="/professional"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition shadow-2xs"
            title="Launch Architect Workspace"
          >
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            <span>Architect Panel</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />`;

if (content.includes(targetBell)) {
  content = content.replace(targetBell, replaceBell);
  console.log('Navbar updated successfully!');
} else {
  console.log('targetBell not found');
}

// Restore CRLF if it was originally CRLF
if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done!');
