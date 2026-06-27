const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('--- USER DATA ---');
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

conn.on('ready', () => {
  // Escribir el script a un archivo temporal en el host del VPS y copiarlo al contenedor
  const cmd = `cat << 'EOF' > /tmp/vps_list_users.js\n${scriptContent}\nEOF\n` +
              `docker cp /tmp/vps_list_users.js absolute-nexus:/app/vps_list_users.js && ` +
              `docker exec absolute-nexus node /app/vps_list_users.js`;
              
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => conn.end());
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '2.24.104.9',
  port: 22,
  username: 'root',
  password: '--Vhfpabq23821@/Mega1321@--'
});
