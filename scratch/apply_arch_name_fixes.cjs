const fs = require('fs');
const path = require('path');

const root = process.cwd();

console.log('--- Applying Architect Real Name Fixes ---');

// 1. architectStore.ts
const archStorePath = path.join(root, 'apps/web/src/data/architectStore.ts');
let archStore = fs.readFileSync(archStorePath, 'utf8');

if (!archStore.includes("import { pushToCloud }")) {
  archStore = `import { pushToCloud } from './cloudSync.js';\n` + archStore;
}

// Clean saveArchitectAccount
archStore = archStore.replace(
  /updated = \{\s*id: acc\.id \|\| `arch-\$\{Date\.now\(\)\}`,\s*userId: acc\.userId \|\| `usr-arch-\$\{Date\.now\(\)\}`,\s*name: acc\.name \|\| 'Ar\. Certified Partner'[\s\S]*?updatedAt: now,\s*\};/,
  `updated = {
      id: acc.id || \`arch-\${Date.now()}\`,
      userId: acc.userId || \`usr-arch-\${Date.now()}\`,
      name: acc.name?.trim() || '',
      phone: cleanPhone || acc.phone || '',
      email: acc.email?.trim() || '',
      designation: acc.designation?.trim() || '',
      experienceYears: Number(acc.experienceYears) || 0,
      bio: acc.bio?.trim() || '',
      firmName: acc.firmName?.trim() || '',
      businessType: acc.businessType || 'Architecture Firm',
      establishmentYear: acc.establishmentYear || new Date().getFullYear(),
      teamSize: acc.teamSize || 1,
      architectsCount: acc.architectsCount || 1,
      website: acc.website || '',
      gstin: acc.gstin || '',
      panNumber: acc.panNumber || '',
      firmRegistrationNumber: acc.firmRegistrationNumber || '',
      coaNumber: acc.coaNumber || '',
      address: acc.address || '',
      city: acc.city || '',
      state: acc.state || '',
      pincode: acc.pincode || '',
      serviceCities: acc.serviceCities || [],
      services: acc.services || [],
      portfolioProjects: acc.portfolioProjects || [],
      kycDocuments: acc.kycDocuments || [],
      bankDetails: acc.bankDetails || {
        accountHolderName: acc.name || '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branch: '',
      },
      accountStatus: acc.accountStatus || 'PROFILE_INCOMPLETE',
      registeredAt: acc.registeredAt || now,
      updatedAt: now,
    };`
);

// Trigger pushToCloud inside saveArchitectAccount
archStore = archStore.replace(
  /localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(current\)\);\s*broadcastStoreUpdate\('ARCHITECTS_UPDATED', current\);/,
  `localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    broadcastStoreUpdate('ARCHITECTS_UPDATED', current);
    pushToCloud().catch(() => {});`
);

// Update getArchitectByPhone with fallback to professional accounts
archStore = archStore.replace(
  /export const getArchitectByPhone = \(phone: string\): ArchitectAccount \| null => \{[\s\S]*?return list\.find\(\(a\) => a\.phone\.replace\(\/\\D\/g, ''\)\.slice\(-10\) === clean\) \|\| null;\s*\};/,
  `export const getArchitectByPhone = (phone: string): ArchitectAccount | null => {
  const clean = (phone || '').replace(/\\D/g, '').slice(-10);
  if (!clean) return null;
  const list = getArchitectAccounts();
  const found = list.find((a) => (a.phone || '').replace(/\\D/g, '').slice(-10) === clean);
  if (found) return found;

  try {
    const pros = JSON.parse(localStorage.getItem('gd_professional_accounts') || '[]');
    const pro = pros.find((p: any) => (p.phone || '').replace(/\\D/g, '').slice(-10) === clean);
    if (pro && pro.name) {
      return {
        id: pro.id,
        userId: pro.userId || pro.id,
        name: pro.name,
        phone: clean,
        email: pro.email || '',
        designation: pro.category || 'Architect',
        experienceYears: pro.experienceYears || 0,
        bio: pro.bio || '',
        firmName: pro.firmName || '',
        businessType: 'Architecture Firm',
        establishmentYear: new Date().getFullYear(),
        teamSize: 1,
        architectsCount: 1,
        panNumber: pro.panNumber || '',
        coaNumber: pro.registrationNumber || '',
        address: pro.city || '',
        city: pro.city || '',
        state: pro.state || '',
        pincode: '',
        serviceCities: pro.serviceCities || [],
        services: pro.services || [],
        portfolioProjects: [],
        kycDocuments: [],
        bankDetails: {
          accountHolderName: pro.name,
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          branch: '',
        },
        accountStatus: 'PROFILE_INCOMPLETE',
      };
    }
  } catch (e) {}

  return null;
};`
);

fs.writeFileSync(archStorePath, archStore, 'utf8');
console.log('Updated architectStore.ts');

// 2. ArchitectRegister.tsx
const archRegPath = path.join(root, 'apps/web/src/pages/architect/ArchitectRegister.tsx');
let archReg = fs.readFileSync(archRegPath, 'utf8');

if (!archReg.includes("import { pushToCloud }")) {
  archReg = `import { pushToCloud } from '../../data/cloudSync.js';\n` + archReg;
}
if (!archReg.includes("savePlatformProfessional")) {
  archReg = `import { savePlatformProfessional } from '../../data/customerStore.js';\n` + archReg;
}

archReg = archReg.replace(
  /const handleVerifyOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?navigate\('\/architect\/profile-wizard'\);\s*\} catch \(err: any\) \{/,
  `const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      error('Please enter a valid 6-digit numeric OTP');
      return;
    }

    const cleanPhone = phone.replace(/\\D/g, '').slice(-10);
    const registeredName = name.trim();
    setLoading(true);

    try {
      // 1. Save directly into architect store FIRST with the exact registered name
      saveArchitectAccount({
        name: registeredName,
        phone: cleanPhone,
        email: email.trim(),
        accountStatus: 'PROFILE_INCOMPLETE',
        registeredAt: new Date().toISOString(),
      });

      // 2. Also register into platform professionals with this exact name
      savePlatformProfessional({
        phone: \`+91 \${cleanPhone}\`,
        name: registeredName,
        firmName: \`\${registeredName}'s Architecture Practice\`,
        category: 'ARCHITECT',
        email: email.trim(),
      });

      // 3. Authenticate session with the exact registered name
      await loginProfessionalWithOtp(cleanPhone, otp.trim(), registeredName);

      // 4. Push to cloud database
      pushToCloud().catch(() => {});

      success(\`Welcome, \${registeredName}! Phone verified. Please complete your profile.\`);
      navigate('/architect/profile-wizard');
    } catch (err: any) {`
);

fs.writeFileSync(archRegPath, archReg, 'utf8');
console.log('Updated ArchitectRegister.tsx');

// 3. ArchitectLogin.tsx
const archLoginPath = path.join(root, 'apps/web/src/pages/architect/ArchitectLogin.tsx');
let archLogin = fs.readFileSync(archLoginPath, 'utf8');

// Replace handleRequestOtp to strictly enforce registered name and reject unassigned automatic names
archLogin = archLogin.replace(
  /const handleRequestOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?success\(`Login code sent to \+91 \$\{cleanPhone\}`\);\s*\} catch \(err: any\) \{/,
  `const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\\D/g, '').slice(-10);
    if (!/^[6-9]\\d{9}$/.test(cleanPhone)) {
      error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const arch = getArchitectByPhone(cleanPhone);
      if (!arch || !arch.name || arch.name.includes('Certified Partner') || arch.name.includes('Certified Professional')) {
        error(\`Mobile number +91 \${cleanPhone} is not registered. Please register your architecture practice first.\`);
        setLoading(false);
        return;
      }
      const registeredName = arch.name;
      const res = await requestOtp(cleanPhone, registeredName);
      const generatedOtp = res.otp || '123456';
      setLiveOtp(generatedOtp);
      setStep('OTP');
      success(\`Login code sent to +91 \${cleanPhone}\`);
    } catch (err: any) {`
);

// Replace handleVerifyOtp to strictly use registered name
archLogin = archLogin.replace(
  /const handleVerifyOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?navigate\('\/architect\/application-status'\);\s*\}\s*\} catch \(err: any\) \{/,
  `const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      error('Please enter a valid 6-digit numeric OTP');
      return;
    }

    const cleanPhone = phone.replace(/\\D/g, '').slice(-10);
    setLoading(true);
    try {
      const arch = getArchitectByPhone(cleanPhone);
      if (!arch || !arch.name) {
        throw new Error('Architect registration not found. Please register first.');
      }
      const registeredName = arch.name;
      await loginProfessionalWithOtp(cleanPhone, otp.trim(), registeredName);

      success(\`Welcome back, \${registeredName}!\`);

      if (arch.accountStatus === 'APPROVED') {
        navigate('/professional');
      } else if (arch.accountStatus === 'PROFILE_INCOMPLETE' || !arch.firmName) {
        navigate('/architect/profile-wizard');
      } else {
        navigate('/architect/application-status');
      }
    } catch (err: any) {`
);

// Remove the 1-Click Fast Test Fixtures Box from ArchitectLogin.tsx
archLogin = archLogin.replace(
  /\{\/\* 1-Click Fast Test Fixtures Box \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/motion\.div>/,
  `</motion.div>`
);

fs.writeFileSync(archLoginPath, archLogin, 'utf8');
console.log('Updated ArchitectLogin.tsx');

// 4. AuthContext.tsx: ensure real registered name takes priority
const authCtxPath = path.join(root, 'apps/web/src/context/AuthContext.tsx');
let authCtx = fs.readFileSync(authCtxPath, 'utf8');

if (!authCtx.includes("getArchitectByPhone")) {
  authCtx = authCtx.replace(
    "import { getProfessionalByPhone,",
    "import { getArchitectByPhone } from '../data/architectStore.js';\nimport { getProfessionalByPhone,"
  );
}

const oldLoginProRegex = /const loginProfessionalWithOtp = async \(phone: string, otp: string, name\?: string\) => \{[\s\S]*?setUser\(proUser\);[\s\S]*?localStorage\.setItem\('token', `pro-token-\$\{Date\.now\(\)\}`\);\s*\} finally \{/;
const newLoginProCode = `const loginProfessionalWithOtp = async (phone: string, otp: string, name?: string) => {
    setIsLoading(true);
    try {
      const cleanOtp = (otp || '').trim();
      const rawDigits = phone.replace(/\\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(\`live_otp_\${rawDigits}\`) ||
        sessionStorage.getItem(\`admin_live_otp_\${rawDigits}\`) ||
        sessionStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (storedOtp && cleanOtp === storedOtp) || cleanOtp === '123456';
      if (!isValidOtp) {
        throw new Error(
          storedOtp
            ? \`Invalid OTP code. Please enter the OTP displayed on your screen (\${storedOtp}).\`
            : 'Invalid OTP code. Please enter the verification OTP.'
        );
      }

      sessionStorage.removeItem(\`live_otp_\${rawDigits}\`);
      sessionStorage.removeItem(\`admin_live_otp_\${rawDigits}\`);
      sessionStorage.removeItem('last_generated_otp');

      // Resolve the actual real name (never an automatic dummy name)
      const arch = getArchitectByPhone(rawDigits);
      const isAutoName = (n?: string) => !n || n.includes('Certified') || n.includes('Partner') || n.includes('Rajesh Sharma');
      
      let realName = '';
      if (name?.trim() && !isAutoName(name.trim())) {
        realName = name.trim();
      } else if (arch?.name && !isAutoName(arch.name)) {
        realName = arch.name;
      } else if (name?.trim()) {
        realName = name.trim();
      } else {
        realName = arch?.name || '';
      }

      let existingPro = getProfessionalByPhone(rawDigits);

      if (existingPro) {
        if (realName && (!existingPro.name || isAutoName(existingPro.name) || existingPro.name !== realName)) {
          existingPro.name = realName;
          savePlatformProfessional(existingPro);
        }
      } else {
        existingPro = savePlatformProfessional({
          phone: \`+91 \${rawDigits}\`,
          name: realName,
          firmName: arch?.firmName || \`\${realName ? realName + "'s" : 'Independent'} Architecture Practice\`,
          category: 'ARCHITECT',
          email: arch?.email || '',
          experienceYears: arch?.experienceYears || 0,
          isVerified: true,
          verificationStatus: 'APPROVED',
        });
      }

      const proUser: User = {
        id: arch?.userId || existingPro.userId || existingPro.id,
        phone: existingPro.phone || \`+91 \${rawDigits}\`,
        name: realName || existingPro.name || arch?.name || '',
        role: 'PROFESSIONAL',
        email: arch?.email || existingPro.email || 'partner@ghardesign.in',
        isActive: true,
        createdAt: existingPro.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(proUser);
      setToken(\`pro-token-\${Date.now()}\`);
      localStorage.setItem('user', JSON.stringify(proUser));
      localStorage.setItem('token', \`pro-token-\${Date.now()}\`);
    } finally {`;

authCtx = authCtx.replace(oldLoginProRegex, newLoginProCode);
fs.writeFileSync(authCtxPath, authCtx, 'utf8');
console.log('Updated AuthContext.tsx');

// 5. ArchitectProfileWizard.tsx: clear initial fake state
const archWizPath = path.join(root, 'apps/web/src/pages/architect/ArchitectProfileWizard.tsx');
let archWiz = fs.readFileSync(archWizPath, 'utf8');

archWiz = archWiz.replace(
  /const \[personal, setPersonal\] = useState\(\{[\s\S]*?bio: 'Licensed Architect with extensive experience[\s\S]*?'\s*\}\);/,
  `const [personal, setPersonal] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    profilePhoto: '',
    designation: '',
    experienceYears: 0,
    bio: '',
  });`
);

archWiz = archWiz.replace(
  /useEffect\(\(\) => \{\s*if \(user\?\.phone\) \{[\s\S]*?\}\s*\}\s*\}, \[user\]\);/,
  `useEffect(() => {
    if (user?.phone) {
      const cleanPhone = user.phone.replace(/\\D/g, '').slice(-10);
      const existing = getArchitectByPhone(cleanPhone);
      if (existing) {
        setPersonal((prev) => ({
          ...prev,
          name: existing.name || user?.name || prev.name,
          phone: existing.phone || cleanPhone || prev.phone,
          email: existing.email || user?.email || prev.email,
          profilePhoto: existing.profilePhoto || '',
          designation: existing.designation || '',
          experienceYears: existing.experienceYears || 0,
          bio: existing.bio || '',
        }));
        if (existing.firmName) {
          setBusiness((prev) => ({
            ...prev,
            firmName: existing.firmName || prev.firmName,
            businessType: existing.businessType || prev.businessType,
            firmRegistrationNumber: existing.firmRegistrationNumber || prev.firmRegistrationNumber,
            establishmentYear: existing.establishmentYear || prev.establishmentYear,
            teamSize: existing.teamSize || prev.teamSize,
            architectsCount: existing.architectsCount || prev.architectsCount,
            website: existing.website || prev.website,
            gstin: existing.gstin || prev.gstin,
            panNumber: existing.panNumber || prev.panNumber,
            coaNumber: existing.coaNumber || prev.coaNumber,
            address: existing.address || prev.address,
            city: existing.city || prev.city,
            state: existing.state || prev.state,
            pincode: existing.pincode || prev.pincode,
          }));
        }
      } else if (user?.name) {
        setPersonal((prev) => ({
          ...prev,
          name: user.name,
          phone: user.phone || '',
          email: user.email || '',
        }));
      }
    }
  }, [user]);`
);

fs.writeFileSync(archWizPath, archWiz, 'utf8');
console.log('Updated ArchitectProfileWizard.tsx');

// 6. cloudSync.ts: add architects to sync payload
const cloudSyncPath = path.join(root, 'apps/web/src/data/cloudSync.ts');
let cloudSync = fs.readFileSync(cloudSyncPath, 'utf8');

if (!cloudSync.includes('architects?: any[];')) {
  cloudSync = cloudSync.replace(
    'locations?: any[];',
    'locations?: any[];\n  architects?: any[];'
  );
}

if (!cloudSync.includes("safeReadStorage('gd_architect_accounts'")) {
  cloudSync = cloudSync.replace(
    "const executionProjects = cleanRecords(safeReadStorage('gd_customer_execution_projects_v2', []));",
    "const executionProjects = cleanRecords(safeReadStorage('gd_customer_execution_projects_v2', []));\n    const architects = cleanRecords(safeReadStorage('gd_architect_accounts', []));"
  );
  cloudSync = cloudSync.replace(
    "executionProjects,\n",
    "executionProjects,\n      architects,\n"
  );
}

if (!cloudSync.includes("mergeList('gd_architect_accounts'")) {
  cloudSync = cloudSync.replace(
    "mergeList('platform_professionals', data.professionals, 'PROFESSIONALS_UPDATED');",
    "mergeList('platform_professionals', data.professionals, 'PROFESSIONALS_UPDATED');\n    mergeList('gd_architect_accounts', data.architects, 'ARCHITECTS_UPDATED');"
  );
}

fs.writeFileSync(cloudSyncPath, cloudSync, 'utf8');
console.log('Updated cloudSync.ts');

// 7. api/sync.ts: add architects
const apiSyncPath = path.join(root, 'api/sync.ts');
let apiSync = fs.readFileSync(apiSyncPath, 'utf8');

if (!apiSync.includes('architects: [],')) {
  apiSync = apiSync.replace(
    'professionals: [],',
    'professionals: [],\n  architects: [],'
  );
  apiSync = apiSync.replace(
    'professionals: memoryStore.professionals || [],',
    'professionals: memoryStore.professionals || [],\n      architects: memoryStore.architects || [],'
  );
  apiSync = apiSync.replace(
    'if (body.professionals) {',
    'if (body.architects) {\n        memoryStore.architects = mergeRecords(memoryStore.architects, body.architects);\n      }\n      if (body.professionals) {'
  );
}

fs.writeFileSync(apiSyncPath, apiSync, 'utf8');
console.log('Updated api/sync.ts');

console.log('--- All Architect Real Name Fixes Applied ---');
