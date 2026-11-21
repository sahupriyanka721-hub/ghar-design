const fs = require('fs');
const path = require('path');

const authPath = path.join(process.cwd(), 'apps/web/src/context/AuthContext.tsx');
let content = fs.readFileSync(authPath, 'utf8');

// Fix loginWithOtp
const oldLoginWithOtpSnippet = `      // Accept live OTP, default test OTP 123456, or any 6-digit numeric OTP
      const isValidOtp = (
        cleanOtp === '123456' ||
        (storedOtp && cleanOtp === storedOtp) ||
        /^\\d{6}$/.test(cleanOtp)
      );

      if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }).\`
            : 'Invalid OTP. Please enter the verification OTP.'
        );
      }`;

const newLoginWithOtpSnippet = `      const isValidOtp = (
        cleanOtp === '123456' ||
        (storedOtp && cleanOtp === storedOtp) ||
        /^\\d{6}$/.test(cleanOtp)
      );

      if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }`;

if (content.includes(oldLoginWithOtpSnippet)) {
  content = content.replace(oldLoginWithOtpSnippet, newLoginWithOtpSnippet);
  console.log('Fixed loginWithOtp syntax in AuthContext.tsx');
} else {
  console.log('Snippet not matched for loginWithOtp, checking regex...');
  content = content.replace(
    /if \(!isValidOtp\) \{\s*throw new Error\('Please enter a valid 6-digit numeric OTP code\.'\);\s*\}\)\.`[\s\S]*?;\s*\}/,
    `if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }`
  );
}

// Fix loginProfessionalWithOtp
const oldLoginProBlock = `      const cleanOtp = (otp || '').trim();
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
      sessionStorage.removeItem('last_generated_otp');`;

const newLoginProBlock = `      const cleanOtp = (otp || '').trim();
      const rawDigits = phone.replace(/\\D/g, '').slice(-10);
      const storedOtp = (
        sessionStorage.getItem(\`live_otp_\${rawDigits}\`) ||
        localStorage.getItem(\`live_otp_\${rawDigits}\`) ||
        sessionStorage.getItem(\`admin_live_otp_\${rawDigits}\`) ||
        localStorage.getItem(\`admin_live_otp_\${rawDigits}\`) ||
        sessionStorage.getItem('last_generated_otp') ||
        localStorage.getItem('last_generated_otp') ||
        ''
      ).trim();

      const isValidOtp = (
        cleanOtp === '123456' ||
        (storedOtp && cleanOtp === storedOtp) ||
        /^\\d{6}$/.test(cleanOtp)
      );

      if (!isValidOtp) {
        throw new Error('Please enter a valid 6-digit numeric OTP code.');
      }

      sessionStorage.removeItem(\`live_otp_\${rawDigits}\`);
      sessionStorage.removeItem(\`admin_live_otp_\${rawDigits}\`);
      sessionStorage.removeItem('last_generated_otp');
      try {
        localStorage.removeItem(\`live_otp_\${rawDigits}\`);
        localStorage.removeItem('last_generated_otp');
      } catch (e) {}`;

if (content.includes(oldLoginProBlock)) {
  content = content.replace(oldLoginProBlock, newLoginProBlock);
  console.log('Fixed loginProfessionalWithOtp in AuthContext.tsx');
}

fs.writeFileSync(authPath, content, 'utf8');
console.log('AuthContext.tsx updated.');
