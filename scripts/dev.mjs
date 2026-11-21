import { spawn } from 'child_process';

console.log('\n🏗️  Starting GharDesign Platform (Backend API + Frontend Web App)...\n');

const api = spawn('npm', ['run', 'dev', '--workspace=@ghar-design/api'], {
  stdio: 'inherit',
  shell: true,
});

const web = spawn('npm', ['run', 'dev', '--workspace=@ghar-design/web'], {
  stdio: 'inherit',
  shell: true,
});

const handleExit = () => {
  api.kill();
  web.kill();
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
