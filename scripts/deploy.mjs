import { spawn } from 'child_process';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const MAX_RETRIES = 5;

function runDeploy(attempt = 1) {
  // Alternate between direct upload and archive mode
  const useArchive = attempt % 2 === 0;
  const args = useArchive 
    ? ['vercel', '--prod', '--archive=tgz', '--yes']
    : ['vercel', '--prod', '--yes'];

  console.log(`\n🚀 [GharDesign] Deploying to Vercel Production (Attempt ${attempt}/${MAX_RETRIES}, Mode: ${useArchive ? 'Archive' : 'Direct'})...\n`);

  const child = spawn(
    'npx',
    args,
    {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        CI: '1',
        NODE_OPTIONS: '--dns-result-order=ipv4first',
        VERCEL_TELEMETRY_DISABLED: '1',
        NO_UPDATE_CHECK: '1',
        VERCEL_DISABLE_UPDATE_CHECK: '1',
        UNDICI_KEEP_ALIVE_TIMEOUT: '0',
        npm_config_update_notifier: 'false',
        npm_config_fund: 'false',
      },
    }
  );

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 [GharDesign] Deployment Successful! Your website is live at:\n   👉 https://ghar-design.vercel.app\n');
      process.exit(0);
    } else {
      if (attempt < MAX_RETRIES) {
        const delaySec = attempt * 3;
        console.log(`\n⚠️ Network handshake timed out. Auto-retrying in ${delaySec}s (${attempt + 1}/${MAX_RETRIES})...\n`);
        setTimeout(() => runDeploy(attempt + 1), delaySec * 1000);
      } else {
        console.error('\n❌ Deployment failed after 5 attempts.');
        console.error('   You can run this directly in your PowerShell terminal:');
        console.error('   $env:NODE_OPTIONS="--dns-result-order=ipv4first"; npx vercel --prod --yes\n');
        process.exit(code || 1);
      }
    }
  });
}

runDeploy();
