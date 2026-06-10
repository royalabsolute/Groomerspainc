const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REMOTE_HOST = '2.24.104.9';
const REMOTE_USER = 'root';
const REMOTE_DIR = '/var/www/groomingpet';

// Fallback password if SSH key is not present in ~/.ssh/
const FALLBACK_PASS = '--Vhfpabq23821@/Mega1321@--';

const conn = new Client();

conn.on('ready', () => {
  console.log('==============================================');
  console.log('   CONNECTED TO VPS VIA SSH                   ');
  console.log('==============================================');
  console.log('Starting Git-based deployment on the server...');
  
  const deployCmd = [
    `cd ${REMOTE_DIR}`,
    'git fetch origin',
    'git reset --hard origin/main',
    'npm install --legacy-peer-deps',
    'npx prisma generate',
    'npm run build',
    'pm2 restart groomingpet',
    'cd absolute-nexus',
    'docker compose down || true',
    'docker compose build --no-cache',
    'docker compose up -d',
    'pm2 status'
  ].join(' && ');

  console.log(`Executing commands on remote host:\n${deployCmd}\n`);

  conn.exec(deployCmd, (err, stream) => {
    if (err) {
      console.error('❌ Command execution error:', err);
      conn.end();
      return;
    }
    
    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    
    stream.on('close', (code) => {
      console.log('==============================================');
      if (code === 0) {
        console.log('   ✅ DEPLOYMENT COMPLETED SUCCESSFULLY       ');
      } else {
        console.log(`   ❌ DEPLOYMENT FAILED WITH EXIT CODE: ${code} `);
      }
      console.log('==============================================');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Error:', err.message);
});

// Configure SSH authentication priority: Key -> Password
let sshConfig = {
  host: REMOTE_HOST,
  port: 22,
  username: REMOTE_USER,
};

const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_ed25519');
const defaultRsaKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');

if (fs.existsSync(defaultKeyPath)) {
  console.log(`Using SSH Key: ${defaultKeyPath}`);
  sshConfig.privateKey = fs.readFileSync(defaultKeyPath);
} else if (fs.existsSync(defaultRsaKeyPath)) {
  console.log(`Using SSH Key: ${defaultRsaKeyPath}`);
  sshConfig.privateKey = fs.readFileSync(defaultRsaKeyPath);
} else {
  console.log('No SSH key found in ~/.ssh/id_ed25519 or ~/.ssh/id_rsa.');
  console.log('Falling back to password authentication.');
  sshConfig.password = process.env.VPS_SSH_PASS || FALLBACK_PASS;
}

console.log(`Connecting to VPS at ${REMOTE_HOST}...`);
conn.connect(sshConfig);
