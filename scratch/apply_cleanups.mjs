import fs from 'fs';
import path from 'path';

const basePath = 'C:/Users/HP/.gemini/antigravity/scratch/ghar-design';

// 1. Clean ProfessionalProfile.tsx
const profProfilePath = path.join(basePath, 'apps/web/src/pages/professional/ProfessionalProfile.tsx');
if (fs.existsSync(profProfilePath)) {
  let content = fs.readFileSync(profProfilePath, 'utf8');
  content = content.replace("user?.name || 'Principal Professional'", "user?.name || ''");
  content = content.replace("businessType || 'Professionalure Firm'", "businessType || ''");
  content = content.replace("user?.phone || '+91 9876543210'", "user?.phone ? `+91 ${user.phone}` : ''");
  content = content.replace("city || 'Delhi NCR'", "city || ''");
  fs.writeFileSync(profProfilePath, content, 'utf8');
  console.log('Cleaned ProfessionalProfile.tsx');
}

// 2. Clean ProfessionalOverview.tsx
const profOverviewPath = path.join(basePath, 'apps/web/src/pages/professional/ProfessionalOverview.tsx');
if (fs.existsSync(profOverviewPath)) {
  let content = fs.readFileSync(profOverviewPath, 'utf8');
  content = content.replace("user?.phone || '9876543210'", "user?.phone || ''");
  content = content.replace("|| 55000000;", ";");
  fs.writeFileSync(profOverviewPath, content, 'utf8');
  console.log('Cleaned ProfessionalOverview.tsx');
}

// 3. Clean professionalStore.ts
const profStorePath = path.join(basePath, 'apps/web/src/data/professionalStore.ts');
if (fs.existsSync(profStorePath)) {
  let content = fs.readFileSync(profStorePath, 'utf8');
  content = content.replace("acc.name || 'Certified Professional'", "acc.name || ''");
  content = content.replace("acc.phone || '9876543210'", "acc.phone || ''");
  content = content.replace("acc.email || 'partner@ghardesign.in'", "acc.email || ''");
  content = content.replace("acc.firmName || 'Engineering & Construction Services'", "acc.firmName || ''");
  content = content.replace("acc.city || 'Gurugram'", "acc.city || ''");
  content = content.replace("acc.state || 'Haryana'", "acc.state || ''");
  content = content.replace("req.professionalPhone || '9876543210'", "req.professionalPhone || ''");
  content = content.replace("req.professionalName || 'Certified Professional'", "req.professionalName || ''");
  content = content.replace("msg.professionalPhone || '9876543210'", "msg.professionalPhone || ''");
  content = content.replace("msg.customerPhone || '9876543220'", "msg.customerPhone || ''");
  content = content.replace("ticket.professionalPhone || '9876543210'", "ticket.professionalPhone || ''");
  content = content.replace("ticket.professionalName || 'Certified Professional'", "ticket.professionalName || ''");
  fs.writeFileSync(profStorePath, content, 'utf8');
  console.log('Cleaned professionalStore.ts');
}

// 4. Clean interiorDesignerStore.ts
const intStorePath = path.join(basePath, 'apps/web/src/data/interiorDesignerStore.ts');
if (fs.existsSync(intStorePath)) {
  let content = fs.readFileSync(intStorePath, 'utf8');
  content = content.replace("customerPhone: q.customerPhone || '9876543210'", "customerPhone: q.customerPhone || ''");
  content = content.replace("customerPhone: bk.customerPhone || '9876543210'", "customerPhone: bk.customerPhone || ''");
  fs.writeFileSync(intStorePath, content, 'utf8');
  console.log('Cleaned interiorDesignerStore.ts');
}

// 5. Fix AdminLayout.tsx handleAdminLogout
const adminLayoutPath = path.join(basePath, 'apps/web/src/components/layouts/AdminLayout.tsx');
if (fs.existsSync(adminLayoutPath)) {
  let content = fs.readFileSync(adminLayoutPath, 'utf8');
  const oldLogout = `  const handleAdminLogout = () => {
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    logout();
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
    } catch (e) {}
    success('Logged out of Admin Console successfully.');
    navigate('/admin', { replace: true });
  };`;

  const newLogout = `  const handleAdminLogout = () => {
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    try {
      logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('gd_admin_session');
      sessionStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-changed'));
      }
    } catch (e) {}
    success('Logged out of Admin Console successfully.');
    window.location.href = '/admin';
  };`;

  if (content.includes(oldLogout)) {
    content = content.replace(oldLogout, newLogout);
    fs.writeFileSync(adminLayoutPath, content, 'utf8');
    console.log('Fixed handleAdminLogout in AdminLayout.tsx (using exact match)');
  } else {
    // Regex replace in case line breaks differ
    content = content.replace(
      /const handleAdminLogout = \(\) => \{[\s\S]*?navigate\('\/admin', \{ replace: true \}\);\s*\};/,
      `const handleAdminLogout = () => {
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    try {
      logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('gd_admin_session');
      sessionStorage.clear();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-changed'));
      }
    } catch (e) {}
    success('Logged out of Admin Console successfully.');
    window.location.href = '/admin';
  };`
    );
    fs.writeFileSync(adminLayoutPath, content, 'utf8');
    console.log('Fixed handleAdminLogout in AdminLayout.tsx (using regex)');
  }
}
